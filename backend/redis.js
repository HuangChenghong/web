// filepath: web/backend/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', err => console.error('[redis] error:', err.message));
redisClient.on('ready', () => console.log('[redis] ready'));

redisClient.connect().catch(err => console.error('[redis] connect fail:', err));

module.exports = redisClient;
