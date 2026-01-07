// File: afriX_backend/src/services/educationService.js
const Education = require("../models/Education");
const {
  EDUCATION_MODULES,
  EDUCATION_CONFIG,
  RESPONSE_MESSAGES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");

/**
 * Hardcoded Quiz Content (MVP)
 * Based on Agent Handbook & User FAQ
 */
const QUIZZES = {
  [EDUCATION_MODULES.WHAT_ARE_TOKENS]: {
    title: "What Are Tokens?",
    questions: [
      {
        question: "NT and CT are:",
        options: [
          "Actual Naira and CFA currency",
          "Digital tokens with reference value to Naira and CFA",
          "Bitcoin or Ethereum",
          "Bank accounts",
        ],
        correct: 1,
      },
      {
        question: "1 NT is pegged to:",
        options: ["1 USD", "1 Naira", "1 Bitcoin", "1 CFA Franc"],
        correct: 1,
      },
      {
        question: "Tokens are stored on:",
        options: [
          "Bank servers",
          "Blockchain",
          "AfriToken servers",
          "Your phone only",
        ],
        correct: 1,
      },
      {
        question: "Can token value fluctuate?",
        options: [
          "No, always fixed",
          "Yes, based on supply/demand",
          "Only during swaps",
          "Never",
        ],
        correct: 1,
      },
      {
        question: "Who controls your tokens?",
        options: ["AfriToken", "Agents", "You (via private key)", "Banks"],
        correct: 2,
      },
    ],
  },
  [EDUCATION_MODULES.HOW_AGENTS_WORK]: {
    title: "How Agents Work",
    questions: [
      {
        question: "Agents are:",
        options: [
          "AfriToken employees",
          "Independent contractors",
          "Bank staff",
          "Automated bots",
        ],
        correct: 1,
      },
      {
        question: "When selling tokens (burn), your tokens go to:",
        options: ["Agent's wallet", "Escrow (locked)", "Platform", "Nowhere"],
        correct: 1,
      },
      {
        question: "Agent's security deposit is in:",
        options: ["Naira", "USDT", "NT", "Bank account"],
        correct: 1,
      },
      {
        question: "If agent doesn't send fiat, what happens?",
        options: [
          "You lose tokens",
          "Tokens refunded from escrow",
          "Agent keeps both",
          "Wait 7 days",
        ],
        correct: 1,
      },
      {
        question: "You should confirm fiat receipt:",
        options: [
          "Immediately",
          "Only after 24 hours",
          "Only if you actually received it",
          "Never",
        ],
        correct: 2,
      },
    ],
  },
  [EDUCATION_MODULES.UNDERSTANDING_VALUE]: {
    title: "Understanding Token Value",
    questions: [
      {
        question: "Swap rates update every:",
        options: ["Hour", "5 minutes", "Day", "Week"],
        correct: 1,
      },
      {
        question: "Platform fee for P2P transfer:",
        options: ["0%", "0.5%", "1.5%", "2%"],
        correct: 1,
      },
    ],
  },
  [EDUCATION_MODULES.SAFETY_SECURITY]: {
    title: "Safety & Security",
    questions: [
      {
        question: "Best way to protect your account:",
        options: [
          "Share password with friends",
          "Use strong password + never share",
          "Use same password everywhere",
          "Write password on paper",
        ],
        correct: 1,
      },
      {
        question: "If someone asks for your password:",
        options: [
          "It's support, give it",
          "Never share — it's a scam",
          "Only if they say 'urgent'",
          "Share via SMS",
        ],
        correct: 1,
      },
    ],
  },
};

const educationService = {
  // Get user progress
  async getProgress(userId) {
    const records = await Education.findAll({
      where: { user_id: userId },
      attributes: ["module", "completed", "attempts", "score", "completed_at"],
    });

    const progress = {};
    Object.values(EDUCATION_MODULES).forEach((mod) => {
      const rec = records.find((r) => r.module === mod);
      progress[mod] = rec
        ? {
            completed: rec.completed,
            attempts: rec.attempts,
            score: rec.score,
            completed_at: rec.completed_at,
          }
        : { completed: false, attempts: 0, score: 0 };
    });
    return progress;
  },

  // Start or get quiz
  getQuiz(module) {
    const quiz = QUIZZES[module];
    if (!quiz) throw new ApiError("Invalid module", 400);
    return {
      title: quiz.title,
      totalQuestions: quiz.questions.length,
      passingScore: EDUCATION_CONFIG.PASS_SCORE,
      questions: quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
      })),
    };
  },

  // Submit quiz
  async submitQuiz(userId, module, answers) {
    const quiz = QUIZZES[module];
    if (!quiz) throw new ApiError("Invalid module", 400);
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length)
      throw new ApiError("Invalid answers format", 400);

    let correct = 0;
    answers.forEach((ans, i) => {
      if (ans === quiz.questions[i].correct) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);

    let record = await Education.findOne({
      where: { user_id: userId, module },
    });

    if (!record) {
      record = await Education.create({ user_id: userId, module });
    }

    if (record.attempts >= EDUCATION_CONFIG.MAX_ATTEMPTS) {
      throw new ApiError("Max attempts reached", 403);
    }

    record.attempts += 1;
    record.score = Math.max(record.score, score);

    const passed = score >= EDUCATION_CONFIG.PASS_SCORE;
    if (passed && !record.completed) {
      record.completed = true;
      record.completed_at = new Date();
    }

    await record.save();

    return {
      score,
      correct,
      total: quiz.questions.length,
      passed,
      attempts_left: EDUCATION_CONFIG.MAX_ATTEMPTS - record.attempts,
      message: passed
        ? RESPONSE_MESSAGES.SUCCESS.EDUCATION_COMPLETED
        : `Need ${EDUCATION_CONFIG.PASS_SCORE}%. Try again!`,
    };
  },

  // Check required education before mint/burn
  async enforceEducation(userId, action) {
    if (!EDUCATION_CONFIG.REQUIRED) return true;

    const required = {
      mint: EDUCATION_CONFIG.MODULES_REQUIRED_FOR_MINT,
      burn: EDUCATION_CONFIG.MODULES_REQUIRED_FOR_BURN,
    }[action];

    if (!required) return true;

    const progress = await this.getProgress(userId);
    const missing = required.filter((mod) => !progress[mod].completed);

    if (missing.length > 0) {
      throw new ApiError(
        `${RESPONSE_MESSAGES.ERROR.EDUCATION_REQUIRED}: Complete ${missing.join(
          ", "
        )}`,
        403
      );
    }
    return true;
  },
};

module.exports = educationService;
