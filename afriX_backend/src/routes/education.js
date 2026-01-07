// File: afriX_backend/src/routes/education.js
const express = require("express");
const router = express.Router();
const educationController = require("../controllers/educationController");
const { authenticate } = require("../middleware/auth");
const Joi = require("joi");

// Validation middleware
const validateSubmit = (req, res, next) => {
  const schema = Joi.object({
    answers: Joi.array().items(Joi.number().integer().min(0).max(3)).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

// All routes require auth
router.use(authenticate);

router.get("/progress", educationController.getProgress);
router.get("/quiz/:module", educationController.getQuiz);
router.post("/submit/:module", validateSubmit, educationController.submitQuiz);

module.exports = router;
