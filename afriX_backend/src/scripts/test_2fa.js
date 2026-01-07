const axios = require('axios');
const speakeasy = require('speakeasy');

const API_URL = 'http://localhost:5002/api/v1';
const EMAIL = 'user_test' + Math.floor(Math.random() * 1000) + '@gmail.com';
const PASSWORD = 'Amin123!';

async function test2FA() {
    try {
        console.log('1. Registering user...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            full_name: 'Test User',
            country_code: 'NG'
        });
        const token = registerRes.data.data.tokens.access_token;
        console.log('✅ Registered:', EMAIL);

        console.log('2. Setting up 2FA...');
        const setupRes = await axios.post(`${API_URL}/auth/2fa/setup`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const secret = setupRes.data.data.secret;
        console.log('✅ Setup initiated. Secret:', secret);

        console.log('3. Verifying 2FA...');
        const otp = speakeasy.totp({
            secret: secret,
            encoding: 'base32'
        });
        await axios.post(`${API_URL}/auth/2fa/verify`, { token: otp }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 2FA Verified & Enabled');

        console.log('4. Logging in (expecting 2FA requirement)...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        if (loginRes.data.requires_2fa) {
            console.log('✅ Login required 2FA as expected');
            const tempToken = loginRes.data.temp_token;

            console.log('5. Validating 2FA login...');
            const loginOtp = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            const validateRes = await axios.post(`${API_URL}/auth/2fa/validate`, {
                temp_token: tempToken,
                token: loginOtp
            });

            if (validateRes.data.success) {
                console.log('✅ 2FA Login Validation Successful!');
                console.log('🎉 Full 2FA Flow Verified!');
            }
        } else {
            console.error('❌ Login did NOT require 2FA!');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

test2FA();
