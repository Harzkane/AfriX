// File: afriX_backend/src/controllers/educationController.js
const educationService = require("../services/educationService");

const educationController = {
  // GET /education/progress
  async getProgress(req, res) {
    const progress = await educationService.getProgress(req.user.id);
    res.json({ success: true, data: progress });
  },

  // GET /education/quiz/:module
  async getQuiz(req, res) {
    const { module } = req.params;
    const quiz = educationService.getQuiz(module);
    res.json({ success: true, data: quiz });
  },

  // POST /education/submit/:module
  async submitQuiz(req, res) {
    const { module } = req.params;
    const { answers } = req.body;
    const result = await educationService.submitQuiz(
      req.user.id,
      module,
      answers
    );w
    res.json({ success: true, data: result });
  },
};

module.exports = educationController;
