const axios = require('axios');
const config = require('../config/botConfig');

let authToken = '';

const fetchAuthToken = async () => {
    try {
        const response = await axios.post(`${config.api.baseUrl}${config.api.authEndpoint}`, {
            email: config.credentials.email,
            password: config.credentials.password,
        });
        authToken = response.data.token;
        console.log('Auth token fetched successfully:', authToken);
        return authToken;
    } catch (error) {
        console.error('Error fetching auth token:', error.message);
        throw error;
    }
};

const getAuthToken = () => authToken;

module.exports = { fetchAuthToken, getAuthToken };
