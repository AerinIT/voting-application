const { Client } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const tracer = require('@opentelemetry/api').trace.getTracer('mythical-server');
const { expressMiddleware } = require('@pyroscope/nodejs');
const Pyroscope = require('@pyroscope/nodejs');
const promClient = require('prom-client');
const logUtils = require('./logging')('mythical-server', 'server');

// Initialize Redis client
const redisClient = redis.createClient({ url: 'redis://mythical-database:6379' });
const app = express();
const port = 4000;

// Use JSON parsing for request bodies
app.use(bodyParser.json());

// Pyroscope and Tracing Initialization
Pyroscope.init({
  appName: 'mythical-beasts-server',
});
app.use(expressMiddleware());

// Prometheus metrics registration
const register = promClient.register;
register.setContentType(promClient.Registry.OPENMETRICS_CONTENT_TYPE);
const responseBucket = new promClient.Histogram({
  name: 'mythical_request_times',
  help: 'Response times for the endpoints',
  labelNames: ['method', 'status', 'endpoint'],
  buckets: [10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 16000],
  enableExemplars: true,
});

// Utility for logging
const logEntry = logUtils(tracer);

// Metric function
const recordResponseTime = (method, status, endpoint, start) => {
  const timeMs = Date.now() - start;
  responseBucket.observe({
    labels: { method, status, endpoint },
    value: timeMs,
  });
};

// POST: Create a new topic
app.post('/api/topics', async (req, res) => {
  const span = tracer.startSpan('create-topic');
  const { topic, description } = req.body;

  const startTime = Date.now();

  if (!topic || !description) {
    span.setStatus({ code: 2, message: 'Topic or description missing' });
    span.end();
    recordResponseTime('POST', '400', '/api/topics', startTime);
    return res.status(400).send('Topic and description are required');
  }

  try {
    await redisClient.hSet('topics', topic, description);
    await redisClient.hSet('votes', topic, JSON.stringify([]));
    const votingUrl = `http://localhost:3001/vote/${topic}`;
    span.setStatus({ code: 1, message: 'Topic created', topics: [topic], attributes: { votingUrl } });
    span.end();
    recordResponseTime('POST', '200', '/api/topics', startTime);
    res.json({ message: 'Topic created!', votingUrl });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error creating topic' });
    span.end();
    recordResponseTime('POST', '500', '/api/topics', startTime);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET: Get a topic's description
app.get('/api/topics/:topic/vote', async (req, res) => {
  const span = tracer.startSpan('get-topic-description');
  const { topic } = req.params;
  const startTime = Date.now();

  try {
    const description = await redisClient.hGet('topics', topic);
    if (!description) {
      span.setStatus({ code: 2, message: 'Topic not found' });
      span.end();
      recordResponseTime('GET', '404', `/api/topics/${topic}/vote`, startTime);
      return res.status(404).send('Topic not found');
    }
    span.end();
    recordResponseTime('GET', '200', `/api/topics/${topic}/vote`, startTime);
    res.json({ topic, description });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error fetching topic' });
    span.end();
    recordResponseTime('GET', '500', `/api/topics/${topic}/vote`, startTime);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Process a vote on a topic
app.post('/api/topics/:topic/vote', async (req, res) => {
  const span = tracer.startSpan('process-vote');
  const { topic } = req.params;
  const { vote, name } = req.body;

  const startTime = Date.now();

  if (!vote || !name) {
    span.setStatus({ code: 2, message: 'Vote and name required' });
    span.end();
    recordResponseTime('POST', '400', `/api/topics/${topic}/vote`, startTime);
    return res.status(400).json({ error: 'Vote and name required' });
  }

  try {
    const currentVotesStr = await redisClient.hGet('votes', topic);
    const currentVotes = currentVotesStr ? JSON.parse(currentVotesStr) : [];
    currentVotes.push({ name, vote });
    await redisClient.hSet('votes', topic, JSON.stringify(currentVotes));
    span.end();
    recordResponseTime('POST', '200', `/api/topics/${topic}/vote`, startTime);
    res.json({ message: 'Vote counted!' });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error processing vote' });
    span.end();
    recordResponseTime('POST', '500', `/api/topics/${topic}/vote`, startTime);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET: Get voting results for a topic
app.get('/api/topics/:topic/results', async (req, res) => {
  const span = tracer.startSpan('get-topic-results');
  const { topic } = req.params;
  const startTime = Date.now();

  try {
    const votesStr = await redisClient.hGet('votes', topic);
    const votes = votesStr ? JSON.parse(votesStr) : [];
    const agreeVotes = votes.filter(v => v.vote === 'agree');
    const notAgreeVotes = votes.filter(v => v.vote === 'not_agree');
    span.end();
    recordResponseTime('GET', '200', `/api/topics/${topic}/results`, startTime);
    res.json({
      topic,
      countAgree: agreeVotes.length,
      countNotAgree: notAgreeVotes.length,
      votes: { agree: agreeVotes, notAgree: notAgreeVotes },
    });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error fetching results' });
    span.end();
    recordResponseTime('GET', '500', `/api/topics/${topic}/results`, startTime);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Metrics endpoint handler (for Prometheus scraping)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
