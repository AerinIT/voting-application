require('./tracing');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const cors = require('cors');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Enable diagnostic logs
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const app = express();

// Updated Redis connection to use the Redis service in Docker
const client = redis.createClient({
    url: 'redis://redis:6379' // Connect to the Redis service running in Docker
});

const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

client.on('error', (err) => {
    console.log('Redis Client Error', err);
    diag.error(`Redis Client Error: ${err.message}`);
});

// Ensure Redis is connected before proceeding
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
        diag.info('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        diag.error(`Failed to connect to Redis: ${err.message}`);
    }
})();

app.post('/api/topics', async (req, res) => {
    const { topic, description } = req.body;
    if (!topic || !description) {
        diag.warn('Topic and description are required');
        return res.status(400).send('Topic and description are required');
    }

    diag.info(`Creating topic: ${topic} with description`);
    await client.hSet('topics', topic, description);
    await client.hSet('votes', topic, JSON.stringify([]));

    const votingUrl = `http://localhost:3001/vote/${topic}`;
    diag.info(`Topic created successfully: ${topic}`);
    res.json({ message: 'Topic created!', votingUrl });
});

app.get('/api/topics/:topic/vote', async (req, res) => {
    const topic = req.params.topic;
    diag.info(`Fetching description for topic: ${topic}`);
    const description = await client.hGet('topics', topic);
    if (!description) {
        diag.warn(`Topic not found: ${topic}`);
        return res.status(404).send('Topic not found');
    }
    diag.info(`Description fetched for topic: ${topic}`);
    res.json({ topic, description });
});

app.post('/api/topics/:topic/vote', async (req, res) => {
    const topic = req.params.topic;
    const { vote, name } = req.body;

    if (!vote || !name) {
        diag.warn(`Vote and name are required for topic: ${topic}`);
        return res.status(400).json({ error: 'Vote and name are required' });
    }

    diag.info(`Processing vote for topic: ${topic} - Name: ${name}, Vote: ${vote}`);
    const currentVotes = JSON.parse(await client.hGet('votes', topic)) || [];
    currentVotes.push({ name, vote });
    await client.hSet('votes', topic, JSON.stringify(currentVotes));

    diag.info(`Vote counted for topic: ${topic} - Name: ${name}, Vote: ${vote}`);
    res.json({ message: 'Vote counted!' });
});

app.get('/api/topics/:topic/results', async (req, res) => {
    const topic = req.params.topic;
    diag.info(`Fetching results for topic: ${topic}`);
    const votes = JSON.parse(await client.hGet('votes', topic)) || [];

    const agreeVotes = votes.filter(v => v.vote === 'agree');
    const notAgreeVotes = votes.filter(v => v.vote === 'not_agree');

    diag.info(`Results fetched for topic: ${topic} - Agree: ${agreeVotes.length}, Not Agree: ${notAgreeVotes.length}`);
    res.json({
        topic,
        countAgree: agreeVotes.length,
        countNotAgree: notAgreeVotes.length,
        votes: {
            agree: agreeVotes,
            notAgree: notAgreeVotes
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    diag.info(`Server running on http://localhost:${PORT}`);
});
