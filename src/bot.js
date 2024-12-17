const TelegramBot = require('node-telegram-bot-api');
const { handleStart } = require('./handlers/startHandler');
const { handleRegistration } = require('./handlers/registrationHandler');
const { fetchAuthToken } = require('./services/authService');
const botConfig = require('./config/botConfig');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const bot = new TelegramBot(botConfig.telegram.token, { polling: true });

// Initialize auth token
fetchAuthToken();

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        await handleStart(bot, chatId);
    } else {
        await handleRegistration(bot, msg);
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


