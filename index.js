const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const token = '7351902378:AAH06YK_d2vbt_l-7uSB6qRF5QvQ1KzvUOQ';
const webAppUrl = 'https://914c-213-230-66-102.ngrok-free.app'; 
const userCheckUrl = 'https://api.asbd.uz/api/core/request';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

let userData = {}; // Temporary storage for user details
let authToken = ''; // Store authentication token

// Fetch authentication token
const fetchAuthToken = async () => {
    try {
        const response = await axios.post('https://api.asbd.uz/api/user/login', {
            email: 'bot', 
            password: 'Asd*-',
        });
        authToken = response.data.token;
        console.log('Token retrieved:', authToken);
    } catch (error) {
        console.error('Error fetching auth token:', error.message);
    }
};

// Helper function for API requests
const apiRequest = async (url, data) => {
    try {
        const response = await axios.post(url, data, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        return response.data;
    } catch (error) {
        console.error(`Error making API request to ${url}:`, error.message);
        throw error;
    }
};

// Start bot
fetchAuthToken();

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        // Reset user data for this chat ID
        userData[chatId] = {};

        // Send the phone number request
        await bot.sendMessage(chatId, 'Iltimos, telefon raqamingizni yuboring', {
            reply_markup: {
                keyboard: [[{ text: 'Telefon raqamini yuborish', request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });

        return; // Exit early to prevent processing any further handlers
    }

    // Handle contact sharing
    if (msg.contact) {
        let fullPhoneNumber = msg.contact.phone_number; // Example: "+998991231212"

        console.log(fullPhoneNumber);
        

     // Sanitize and normalize the phone number
        fullPhoneNumber = fullPhoneNumber.replace(/[^\d]/g, ''); // Remove non-digit characters except '+'


     const userPhoneNumber = fullPhoneNumber.substring(3);


        try {
            // Check if user exists
            const response = await apiRequest(userCheckUrl, { obj: { id: 153, user_code: userPhoneNumber } });

            if (response.payload?.success) {
                // User exists, send confirmation code prompt
                const { code, customer_id } = response.payload.data;

                userData[chatId] = {
                    phone: userPhoneNumber,
                    code, // Store the verification code
                    customerId: customer_id
                };
                console.log(userData[chatId]);

                await bot.sendMessage(chatId, 'Xush kelibsiz! Iltimos, SMS orqali yuborilgan tasdiqlash kodini kiriting.');
            } else {
                // User does not exist, prompt for full name
                userData[chatId] = { phone: userPhoneNumber };
                await bot.sendMessage(chatId, 'Siz hali ro\'yxatdan o\'tmagan ekansiz. Iltimos, to\'liq ismingizni yuboring.');
            }
        } catch (error) {
            await bot.sendMessage(chatId, 'Foydalanuvchini tekshirishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
            console.error('Error during user existence check:', error.message);
        }
    }

    // Handle confirmation code input
    else if (userData[chatId]?.code && !userData[chatId]?.verified) {
        const enteredCode = text.trim();
        const valUrl = encodeURI('https://t.me/ELEVEN_002');

        if (enteredCode === String(userData[chatId].code)) {
            userData[chatId].verified = true;

            // Successful code verification, show the menu
            await bot.sendMessage(chatId, 'Tasdiqlash kodi muvaffaqiyatli kiritildi. Xush kelibsiz!', {
                reply_markup: {
                    keyboard: [
                        [
                            { text: 'Buyurtma qilish'}, // url add
                            { text: 'Mening buyurtmalarim' }
                        ],
                        [
                            { text: 'Qo\'llab-quvvatlash' },
                            { text: 'Aksiya' }
                        ],
                        [
                            { text: 'Kullerlar' }
                        ]
                    ],
                    resize_keyboard: true, // Ensures keyboard adjusts to device size
                    one_time_keyboard: false // Keeps the menu persistent
                }
            });

            // delete userData[chatId]; // Clear user data
        } else {
            await bot.sendMessage(chatId, 'Tasdiqlash kodi noto\'g\'ri. Iltimos, yana bir bor urinib ko\'ring.');
        }
    }

    // Handle full name input for new users
    else if (userData[chatId]?.phone && !userData[chatId]?.fullName && !userData[chatId].verified) {
        userData[chatId].fullName = text;
        await bot.sendMessage(chatId, 'Rahmat! Endi joylashuvingizni yuboring.', {
            reply_markup: {
                keyboard: [[{ text: 'Joylashuvni yuborish', request_location: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    // Handle location input for new users
    else if (msg.location && userData[chatId]?.fullName) {
        userData[chatId].location = msg.location;
        await bot.sendMessage(chatId, 'Rahmat! Endi manzilingizni yuboring.');
    }

    // Handle address input and complete sign-up
    else if (userData[chatId]?.location && !userData[chatId]?.address) {
        userData[chatId].address = text;

        const signUpData = {
            obj: {
                id: 152,
                user_code: userData[chatId].phone,
                full_name: userData[chatId].fullName,
                address: userData[chatId].address,
                phones: [{ order: 1, phone: userData[chatId].phone }],
                birthdate: "2024-08-03",
                passport_seria: "AB0733649",
                location_x: userData[chatId].location.latitude,
                location_y: userData[chatId].location.longitude,
                delivery_address: userData[chatId].address,
                region: 4,
                district: 61
            }
        };

        try {
            const response = await apiRequest(userCheckUrl, signUpData);
            if (response?.payload?.success) {
                const { code, customer_id } = response.payload.data;
                userData[chatId].code = code;
                userData[chatId].customerId = customer_id;
                console.log(userData[chatId].code);

                await bot.sendMessage(chatId, 'Ro\'yxatdan o\'tish deyarli tugadi. Iltimos, SMS orqali yuborilgan tasdiqlash kodini kiriting.');
            } else {
                await bot.sendMessage(chatId, 'Ro\'yxatdan o\'tishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
            }
        } catch (error) {
            console.error('Error during sign-up:', error.message);
            await bot.sendMessage(chatId, 'Ro\'yxatdan o\'tishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
        }
    }

    if (text === 'Mening buyurtmalarim') {
        console.log(userData[chatId]);
        
        if (!userData[chatId]?.customerId) {
            await bot.sendMessage(chatId, 'Avval telefon raqamingiz orqali tizimga kiring.');
            return;
        }

        try {
            const response = await apiRequest(userCheckUrl, {
                obj: {
                    id: 133,
                    client_id: 37896
                }
            });

            const history = response.payload?.history || [];
            const bottleCredit = response.payload?.bottle_credit_quantity || 0;

            let message = '🛒 Буюртмалар\n\n';

            if (history.length > 0) {
                history.forEach((order) => {
                    message += `**************\n`;
                    message += `🕐 Буюртма ҳолати: ${order.status_name || 'Маълум эмас'}\n`;
                    message += `📄 Умумий маҳсулот сони: ${order.total_ordered_items || 0}\n`;
                    message += `💰 Умумий сумма: ${order.total_ordered_price || 0}\n`;
                    message += `📍 Манзил: ${order.teritory_name || 'Маълум эмас'}\n`;
                    message += `📆 Сана: ${order.created_on_text || 'Маълум эмас'}\n`;
                    message += `💬 Изоҳингиз: ${order.comment || 'Йўқ'}\n`;
                    message += `**************\n\n`;
                });
            } else {
                message += 'Ҳозирча ҳеч қандай буюртмани топмадик.\n';
            }

            message += `\n💳 Бутилка кредитлари: ${bottleCredit}`;

            await bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Error fetching order history:', error.message);
            await bot.sendMessage(chatId, 'Буюртмалар тарихини олишда хатолик юз берди.');
        }
        return;
    }
    if (text === 'Aksiya' || text === 'Kullerlar') {
        const valUrl = encodeURI('https://telegra.ph/Bu-test-uchun-12-05');
        await bot.sendMessage(chatId, 'Batafsil m\'a\'lumot olish uchun', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Batafsil', web_app:{url:valUrl}}]
                ]
            }
        });
    }
    

    //Default fallback
    else if (!msg.contact  && text !== '/start' ) {
        // userData[chatId] = {};
        await bot.sendMessage(chatId, 'Iltimos, davom etish uchun telefon raqamingizni yuboring.');
    }
});


// Start Express server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});

