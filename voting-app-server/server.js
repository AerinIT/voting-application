require('./tracing'); // Ensure OpenTelemetry tracing setup is done here
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const cors = require('cors');
const { trace } = require('@opentelemetry/api');
const client = require('prom-client');

const tracer = trace.getTracer('voting-app-server');
const app = express();
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

app.use(cors());
app.use(bodyParser.json());

// Redis connection
redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

(async () => {
  try {
      await redisClient.connect();
      console.log('Connected to Redis');
  } catch (err) {
      console.error('Failed to connect to Redis:', err);
  }
})();

app.post('/api/topics', async (req, res) => {
  const span = tracer.startSpan('create-topic');
  const { topic, description } = req.body;

  if (!topic || !description) {
    span.setStatus({ code: 2, message: 'Topic or description missing' });
    span.end();
    return res.status(400).send('Topic and description are required');
  }

  try {
    await redisClient.hSet('topics', topic, description);
    await redisClient.hSet('votes', topic, JSON.stringify([]));
    const votingUrl = `http://localhost:3001/vote/${topic}`;
    span.setStatus({ code: 1, message: 'Topic created', topics: [topic], attributes: { votingUrl } });
    span.end();
    res.json({ message: 'Topic created!', votingUrl });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error creating topic' });
    span.end();
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/topics/:topic/vote', async (req, res) => {
  const span = tracer.startSpan('get-topic-description');
  const { topic } = req.params;

  try {
    const description = await redisClient.hGet('topics', topic);
    if (!description) {
      span.setStatus({ code: 2, message: 'Topic not found' });
      span.end();
      return res.status(404).send('Topic not found');
    }
    span.end();
    res.json({ topic, description });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error fetching topic' });
    span.end();
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/topics/:topic/vote', async (req, res) => {
  const span = tracer.startSpan('process-vote');
  const { topic } = req.params;
  const { vote, name } = req.body;

  if (!vote || !name) {
    span.setStatus({ code: 2, message: 'Vote and name required' });
    span.end();
    return res.status(400).json({ error: 'Vote and name required' });
  }

  try {
    const currentVotesStr = await redisClient.hGet('votes', topic);
    const currentVotes = currentVotesStr ? JSON.parse(currentVotesStr) : [];
    currentVotes.push({ name, vote });
    await redisClient.hSet('votes', topic, JSON.stringify(currentVotes));
    span.end();
    res.json({ message: 'Vote counted!' });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error processing vote' });
    span.end();
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/topics/:topic/results', async (req, res) => {
  const span = tracer.startSpan('get-topic-results');
  const { topic } = req.params;

  try {
    const votesStr = await redisClient.hGet('votes', topic);
    const votes = votesStr ? JSON.parse(votesStr) : [];
    const agreeVotes = votes.filter(v => v.vote === 'agree');
    const notAgreeVotes = votes.filter(v => v.vote === 'not_agree');
    span.end();
    res.json({
      topic,
      countAgree: agreeVotes.length,
      countNotAgree: notAgreeVotes.length,
      votes: { agree: agreeVotes, notAgree: notAgreeVotes },
    });
  } catch (err) {
    span.setStatus({ code: 2, message: 'Error fetching results' });
    span.end();
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});