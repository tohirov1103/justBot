const apiRequest = require('../utils/apiRequest');
const config = require('../config/botConfig');

let userData = {};

// Helper function to check if the user exists
const checkUserExistence = async (phoneNumber) => {
    try {
        const response = await apiRequest(`${config.api.baseUrl}${config.api.userCheckEndpoint}`, {
            obj: {
                id: 153, // Endpoint ID for user existence check
                user_code: phoneNumber,
            },
        });
        return response?.payload?.success || false; // Return true if user exists
    } catch (error) {
        console.error('Error checking user existence:', error.message);
        return false; // Assume user does not exist on failure
    }
};

const handleRegistration = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Step 1: Handle phone number input and check user existence
    if (msg.contact) {
        const phoneNumber = msg.contact.phone_number.substring(4); // Extract phone number
        const userExists = await checkUserExistence(phoneNumber);

        if (userExists) {
            // User exists, send a welcome message
            await bot.sendMessage(chatId, 'Добро пожаловать! Вы уже зарегистрированы.', {
                reply_markup: {
                    keyboard: [
                        [{ text: 'Сделать заказ', web_app: { url: config.webAppUrl } }],
                    ],
                    resize_keyboard: true,
                },
            });
        } else {
            // User does not exist → Start registration process
            userData[chatId] = { phone: phoneNumber };
            await bot.sendMessage(chatId, 'Вы не зарегистрированы. Пожалуйста, отправьте ваше полное имя.');
        }
    } 

    // Step 2: Handle full name input
    else if (userData[chatId]?.phone && !userData[chatId]?.fullName) {
        userData[chatId].fullName = text;
        await bot.sendMessage(chatId, 'Спасибо! Теперь отправьте вашу локацию.', {
            reply_markup: {
                keyboard: [[{ text: 'Отправить локацию', request_location: true }]],
                resize_keyboard: true,
            },
        });
    } 

    // Step 3: Handle location input
    else if (msg.location) {
        userData[chatId].location = msg.location;
        await bot.sendMessage(chatId, 'Спасибо! Теперь отправьте ваш адрес.');
    } 

    // Step 4: Handle address input and complete sign-up
    else if (userData[chatId]?.location && !userData[chatId]?.address) {
        userData[chatId].address = text;

        try {
            const signUpData = {
                obj: {
                    id: 152, // Endpoint ID for user sign-up
                    user_code: userData[chatId].phone,
                    full_name: userData[chatId].fullName,
                    address: userData[chatId].address,
                    location_x: userData[chatId].location.latitude,
                    location_y: userData[chatId].location.longitude,
                },
            };

            // Send sign-up request
            const response = await apiRequest(`${config.api.baseUrl}${config.api.userCheckEndpoint}`, signUpData);

            if (response?.payload?.success) {
                userData[chatId].code = response.payload.data.code;
                await bot.sendMessage(chatId, 'Введите код подтверждения, отправленный вам по SMS.');
            } else {
                await bot.sendMessage(chatId, 'Ошибка регистрации. Попробуйте снова.');
            }
        } catch (error) {
            console.error('Registration failed:', error.message);
            await bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте позже.');
        }
    }

    // Step 5: Handle verification code input
    else if (userData[chatId]?.code && !userData[chatId]?.verified) {
        const enteredCode = text.trim();

        if (enteredCode === String(userData[chatId].code)) {
            userData[chatId].verified = true;

            // Registration complete
            await bot.sendMessage(chatId, 'Регистрация успешно завершена! Добро пожаловать!', {
                reply_markup: {
                    keyboard: [
                        [
                            { text: 'Сделать заказ', web_app: { url: config.webAppUrl } },
                            { text: 'Мои заказы', web_app: { url: config.webAppUrl } },
                        ],
                    ],
                    resize_keyboard: true,
                },
            });

            // Clear user data after successful verification
            te userData[chatId];
        } else {
            await bot.sendMessage(chatId, 'Неверный код подтверждения. Попробуйте еще раз.');
        }
    }

    // Step 6: Prompt for phone number if not provided
    else if (!msg.contact && text !== '/start') {
        await bot.sendMessage(chatId, 'Пожалуйста, отправьте свой номер телефона, чтобы продолжить.');
    }
};

module.exports = { handleRegistration };
