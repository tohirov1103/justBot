const botConfig = require('../config/botConfig');

const handleStart = async (bot, chatId) => {
    await bot.sendMessage(chatId, 'Пожалуйста, поделитесь вашим номером телефона', {
        reply_markup: {
            keyboard: [
                [{ text: 'Отправить номер телефона', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
};

module.exports = { handleStart };
