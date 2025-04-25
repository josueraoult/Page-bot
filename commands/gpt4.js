const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'Interact with GPT-4o',
  usage: 'gpt4 [your message]',
  author: 'vidrush',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);
    }

    try {
      const url = `https://api.zetsu.xyz/api/blackbox?prompt=${encodeURIComponent(prompt)}&uid=6`;
      const { data } = await axios.get(url);

      if (data.status && data.response) {
        sendMessage(senderId, { text: data.response }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'API returned an unexpected response.' }, pageAccessToken);
      }

    } catch (error) {
      console.error("Erreur d'API :", error.message);
      sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
    }
  }
};
