const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const serverless = require('serverless-http');
const { handleMessage } = require('../handles/handleMessage');
const { handlePostback } = require('../handles/handlePostback');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync(path.join(__dirname, '../token.txt'), 'utf8').trim();
const COMMANDS_PATH = path.join(__dirname, '../commands');

app.get('/api/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  res.sendStatus(400);
});

app.post('/api/webhook', (req, res) => {
  const { body } = req;
  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(event => {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN);
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      });
    });
    return res.status(200).send('EVENT_RECEIVED');
  }
  res.sendStatus(404);
});

const sendMessengerProfileRequest = async (method, url, data = null) => {
  try {
    const response = await axios({
      method,
      url: `https://graph.facebook.com/v21.0${url}?access_token=${PAGE_ACCESS_TOKEN}`,
      headers: { 'Content-Type': 'application/json' },
      data
    });
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} request:`, error.response?.data || error.message);
    throw error;
  }
};

const loadCommands = () => {
  return fs.readdirSync(COMMANDS_PATH)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const command = require(path.join(COMMANDS_PATH, file));
      return command.name && command.description ? { name: command.name, description: command.description } : null;
    })
    .filter(Boolean);
};

const loadMenuCommands = async () => {
  const commands = loadCommands();
  await sendMessengerProfileRequest('post', '/me/messenger_profile', {
    commands: [{ locale: 'default', commands }],
  });
  console.log('Menu commands loaded (Vercel start)');
};

// Charger les commandes une fois au démarrage
loadMenuCommands().catch(console.error);

module.exports = app;
module.exports.handler = serverless(app);
