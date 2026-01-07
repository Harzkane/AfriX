// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/routes/config.js
const express = require("express");
const router = express.Router();
const { COUNTRIES, CURRENCIES, COUNTRY_DETAILS } = require("../config/constants");

/**
 * @route   GET /api/v1/config/countries
 * @desc    Get list of supported countries with their currencies
 * @access  Public
 */
router.get("/countries", (req, res) => {
    try {
        // Generate country list dynamically from constants
        const countryList = Object.entries(COUNTRY_DETAILS).map(([code, details]) => ({
            code,
            name: details.name,
            currency: details.currency,
        }));

        res.json({
            success: true,
            data: countryList,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch countries",
            error: error.message,
        });
    }
});

/**
 * @route   GET /api/v1/config/currencies
 * @desc    Get list of supported currencies
 * @access  Public
 */
router.get("/currencies", (req, res) => {
    try {
        res.json({
            success: true,
            data: CURRENCIES,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch currencies",
            error: error.message,
        });
    }
});

module.exports = router;
