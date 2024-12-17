const axios = require('axios');
const { getAuthToken } = require('../services/authService');

const apiRequest = async (url, data) => {
    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`API request error: ${error.message}`);
        throw error;
    }
};

module.exports = apiRequest;
