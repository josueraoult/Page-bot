const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'Interact with GPT-4o',
  usage: 'gpt4 [your message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);
    }

    try {
      const url = `https://api.zetsu.xyz/api/blackbox?prompt=${encodeURIComponent(prompt)}&uid=6`;
      const { data } = await axios.get(url);
      sendMessage(senderId, { text: data.response || data }, pageAccessToken);
    } catch (error) {
      sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
    }
  }
};
