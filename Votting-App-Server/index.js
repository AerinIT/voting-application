const traceUtils = require('./tracing')('server', 'votting-app-server');
const Pyroscope = require('@pyroscope/nodejs');
const { expressMiddleware } = require('@pyroscope/nodejs');
const logUtils = require('./logging')('votting-app-server', 'server');
const cors = require('cors');

(async () => {
    const traceObj = await traceUtils();
    const logEntry = await logUtils(traceObj);
    const { tracer, api } = traceObj;

    const promClient = require('prom-client');
    const express = require('express');
    const bodyParser = require('body-parser');
    const { Client } = require('pg');
    const { nameSet, servicePrefix, spanTag } = require('./endpoints')();

    const app = express();
    const register = promClient.register;
    register.setContentType(promClient.Registry.OPENMETRICS_CONTENT_TYPE);

    const teardownTimeout = 24 * 60 * 60 * 1000; 
    let teardownInProgress = false;

    app.use(bodyParser.json());
    app.use(cors());
    let pgClient;


    const responseBucket = new promClient.Histogram({
        name: 'votting_request_times',
        help: 'Response times for the endpoints',
        labelNames: ['method', 'status', spanTag, 'endpoint', 'table', 'rows', 'columns'],
        buckets: [10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 16000],
        enableExemplars: true,
    });


    const responseMetric = (details) => {
        const timeMs = Date.now() - details.start;
        const spanContext = api.trace.getSpan(api.context.active()).spanContext();
        responseBucket.observe({
            labels: details.labels,
            value: timeMs,
            exemplarLabels: {
                traceID: spanContext.traceId,
                spanID: spanContext.spanId,
            },
        });
    };

    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', register.contentType);
        res.send(await register.metrics());
    });

    Pyroscope.init({ appName: 'votting-app-database-server' });
    app.use(expressMiddleware());

    app.post('/api/topics', async (req, res) => {
        const currentSpan = api.trace.getSpan(api.context.active());
        const traceId = currentSpan.spanContext().traceId;

        let metricBody = {
            labels: { method: 'POST', endpoint: 'createTopic' },
            start: Date.now(),
        };

        const { topic, description } = req.body;

        // Validate input data
        if (!topic || !description) {
            metricBody.labels.status = '400';
            responseMetric(metricBody);
            res.status(400).send('Topic name and description are required.');
            return;
        }

        try {
            // Insert topic into the database
            const query = `INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING id`;
            const result = await pgClient.query(query, [topic, description]);

            // Get the total number of topics
            const tableDetail = await pgClient.query(
                `SELECT COUNT(*) AS row_count FROM topics`
            );

            // Metrics after successful topic creation
            metricBody.labels.status = '201';
            metricBody.labels.table = 'topics';
            metricBody.labels.rows = tableDetail.rows[0].row_count;
            metricBody.labels.columns = 'name, description';
            responseMetric(metricBody);

            // Log the creation of the new topic
            logEntry({
                level: 'debug',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'createTopic',
                message: `Topic created successfully with ID ${result.rows[0].id}`,
                table: 'topics',
                rows: tableDetail.rows[0].row_count,
                columns: 'name, description',
            });

            // Respond with success
            const votingUrl = `http://localhost:3001/vote/${result.rows[0].id}`;
            res.status(201).json({ message: 'Topic created successfully!', votingUrl });
        } catch (err) {
            // Handle errors during topic creation
            metricBody.labels.status = '500';
            responseMetric(metricBody);

            logEntry({
                level: 'error',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'createTopic',
                message: `Error creating topic: ${err.message}`,
                table: 'topics',
                rows: 0,
                columns: 'name, description',
            });

            res.status(500).send('Error creating topic.');
        }
    });


    app.get('/api/topics/:topic/vote', async (req, res) => {
        const currentSpan = api.trace.getSpan(api.context.active());
        const traceId = currentSpan.spanContext().traceId;

        let metricBody = {
            labels: { method: 'GET', endpoint: 'get-topic-description' },
            start: Date.now(),
        };

        const { topic } = req.params;

        try {
            const result = await pgClient.query(
                `SELECT name,description FROM topics WHERE id = $1`,
                [topic]
              );
              
              // Extract the description value from the first row
              const description = result.rows[0]?.description;
              const topicName = result.rows[0]?.name;

            if (!description) {
                metricBody.labels.status = '404';
                responseMetric(metricBody);

                logEntry({
                    level: 'info',
                    traceID: traceId,
                    namespace: process.env.NAMESPACE,
                    job: `${servicePrefix}-server`,
                    endpoint: 'get-topic-description',
                    message: `Topic '${topic}' not found`,
                    table: 'topics',
                    rows: 0,
                    columns: 'description',
                });

                return res.status(404).send('Topic not found');
            }

            metricBody.labels.status = '200';
            responseMetric(metricBody);

            logEntry({
                level: 'info',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'get-topic-description',
                message: `Fetched topic description for '${topic}'`,
                table: 'topics',
                rows: 1,
                columns: 'description',
            });

            res.json({ topic: topicName , description });
        } catch (err) {
            metricBody.labels.status = '500';
            responseMetric(metricBody);

            logEntry({
                level: 'error',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'get-topic-description',
                message: `Error fetching topic description for '${topic}': ${err.message}`,
                table: 'topics',
                rows: 0,
                columns: 'description',
            });

            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    app.post('/api/topics/:topic/vote', async (req, res) => {
        const currentSpan = api.trace.getSpan(api.context.active());
        const traceId = currentSpan.spanContext().traceId;

        let metricBody = {
            labels: { method: 'POST', endpoint: 'vote' },
            start: Date.now(),
        };

        const { topic } = req.params;
        const { vote, name } = req.body;

        // Validate input
        if (!vote || !name) {
            metricBody.labels.status = '400';
            responseMetric(metricBody);

            logEntry({
                level: 'info',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'vote',
                message: 'Vote and name are required',
                table: 'votes',
                rows: 0,
                columns: 'vote, name',
            });

            return res.status(400).json({ error: 'Vote and name are required' });
        }

        try {
            // Insert the vote into the database
            const query = `INSERT INTO votes (topic_id, name, vote) VALUES ($1, $2, $3) RETURNING id`;
            const result = await pgClient.query(query, [topic, name, vote]);

            // Get the total count of votes for the topic
            const tableDetail = await pgClient.query(
                `SELECT COUNT(*) AS row_count FROM votes WHERE topic_id = $1`,
                [topic]
            );

            // Metrics for the vote insertion
            metricBody.labels.status = '201';
            metricBody.labels.table = 'votes';
            metricBody.labels.rows = tableDetail.rows[0].row_count;
            metricBody.labels.columns = 'topic_id, name, vote';
            responseMetric(metricBody);

            logEntry({
                level: 'debug',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'vote',
                message: `Vote submitted successfully for topic '${topic}' by ${name} with vote ID ${result.rows[0].id}`,
                table: 'votes',
                rows: tableDetail.rows[0].row_count,
                columns: 'topic_id, name, vote',
            });

            res.status(201).json({ message: 'Vote counted!' });
        } catch (err) {
            // Handle errors
            metricBody.labels.status = '500';
            responseMetric(metricBody);

            logEntry({
                level: 'error',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: 'vote',
                message: `Error processing vote for topic '${topic}': ${err.message}`,
                table: 'votes',
                rows: 0,
                columns: 'topic_id, name, vote',
            });

            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    app.get('/api/topics/:topic/results', async (req, res) => {
        const currentSpan = api.trace.getSpan(api.context.active());
        const traceId = currentSpan.spanContext().traceId;
    
        let metricBody = {
            labels: { method: 'GET', endpoint: '/api/topics/:topic/results' },
            start: Date.now(),
        };
    
        const { topic } = req.params;
    
        if (!topic) {
            metricBody.labels.status = '400';
            responseMetric(metricBody);
            res.status(400).send('Topic ID is required.');
            return;
        }
    
        try {
            const result = await pgClient.query(
                `SELECT vote,name FROM votes WHERE topic_id = $1`,
                [topic]
            );

            const topicName = await pgClient.query(
                `SELECT name FROM topics WHERE id = $1`,
                [topic]
            );
    
            const agreeVotes = [];
            const notAgreeVotes = [];
    
            result.rows.forEach((row) => {
                if (row.vote === 'agree') {
                    agreeVotes.push(row.name);
                } else if (row.vote === 'not_agree') {
                    notAgreeVotes.push(row.name);
                }
            });
    
            const tableDetail = await pgClient.query(
                `SELECT COUNT(*) AS row_count FROM votes WHERE topic_id = $1`,
                [topic]
            );
    
            metricBody.labels.status = '200';
            metricBody.labels.table = 'votes';
            metricBody.labels.rows = tableDetail.rows[0].row_count;
            metricBody.labels.columns = 'vote';
            responseMetric(metricBody);
    
            logEntry({
                level: 'debug',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: '/api/topics/:topic/results',
                message: 'Result fetched successfully',
                table: 'votes',
                rows: tableDetail.rows[0].row_count,
                columns: 'vote',
            });
    
            res.status(200).json({
                topic: topicName.rows[0].name,
                countAgree: agreeVotes.length,
                countNotAgree: notAgreeVotes.length,
                votes: {
                    agree: agreeVotes,
                    notAgree: notAgreeVotes,
                },
            });
        } catch (err) {
            metricBody.labels.status = '500';
            responseMetric(metricBody);
    
            logEntry({
                level: 'error',
                traceID: traceId,
                namespace: process.env.NAMESPACE,
                job: `${servicePrefix}-server`,
                endpoint: '/api/topics/:topic/results',
                message: `Error fetching result: ${err.message}`,
                table: 'votes',
                rows: 0,
                columns: 'vote',
            });
    
            res.status(500).send('Error fetching result.');
        }
    });

    const startServer = async () => {
        const requestSpan = tracer.startSpan('server');
        await api.context.with(api.trace.setSpan(api.context.active(), requestSpan), async () => {
            try {
                logEntry({
                    level: 'info',
                    job: `${servicePrefix}-server`,
                    namespace: process.env.NAMESPACE,
                    message: 'Connecting to Postgres...',
                });
    
                // Initial connection to Postgres (default database, usually 'postgres')
                pgClient = new Client({
                    host: 'votting-app-database',
                    port: 5432,
                    user: 'postgres',
                    password: 'postgres',
                });
    
                await pgClient.connect();
    
                // Check if the database exists
                const results = await pgClient.query(`SELECT datname FROM pg_database WHERE datname = '${spanTag}'`);
                if (results.rows.length === 0) {
                    logEntry({
                        level: 'debug',
                        job: `${servicePrefix}-server`,
                        namespace: process.env.NAMESPACE,
                        message: `Database '${spanTag}' not found, creating...`,
                    });
    
                    // Create the database if it doesn't exist
                    await pgClient.query(`CREATE DATABASE ${spanTag}`);
                    logEntry({
                        level: 'info',
                        job: `${servicePrefix}-server`,
                        namespace: process.env.NAMESPACE,
                        message: `Database '${spanTag}' created.`,
                    });
                }
    
                // Disconnect from the current database and reconnect to the newly created one
                await pgClient.end();
                pgClient = new Client({
                    host: 'votting-app-database',
                    port: 5432,
                    user: 'postgres',
                    password: 'postgres',
                    database: spanTag, // Connect to the newly created database
                });
    
                await pgClient.connect();
    
                // Create 'votes' table if it doesn't exist
                await pgClient.query(`
                    CREATE TABLE IF NOT EXISTS votes (
                        id SERIAL PRIMARY KEY,
                        topic_id INT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        vote VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
    
                // Create 'topics' table if it doesn't exist
                await pgClient.query(`
                    CREATE TABLE IF NOT EXISTS topics (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
    
                logEntry({
                    level: 'info',
                    namespace: process.env.NAMESPACE,
                    job: `${servicePrefix}-server`,
                    message: 'Tables ensured in database.',
                });

            } catch (err) {
                if (pgClient) {
                    await pgClient.end(); // Ensure the client disconnects in case of error
                }
                logEntry({
                    level: 'error',
                    namespace: process.env.NAMESPACE,
                    job: `${servicePrefix}-server`,
                    message: `Error starting database: ${err}`,
                });
                setTimeout(startServer, 5000); // Retry starting the server after 5 seconds
            } finally {
                requestSpan.end();
            }
        });
    };
    
    // Ensure the server listens on port 5000 (as per your `app.listen` call)
    app.listen(5000, () =>
        logEntry({
            level: 'info',
            namespace: process.env.NAMESPACE,
            job: `${servicePrefix}-server`,
            message: `${servicePrefix} server is running on port 5000`,
        })
    );
    
    startServer();
    
    
})();