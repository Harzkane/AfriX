// File: afriX_backend/src/middleware/validation.js

const Joi = require("joi");
const { HTTP_STATUS, COUNTRIES } = require("../config/constants");

/**
 * Validate registration input
 */
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base":
          "Password must contain uppercase, lowercase, and number",
        "any.required": "Password is required",
      }),
    full_name: Joi.string().min(2).max(255).required().messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 255 characters",
      "any.required": "Full name is required",
    }),
    country_code: Joi.string()
      .length(2)
      .uppercase()
      .valid(...Object.values(COUNTRIES))
      .required()
      .messages({
        "string.length": "Country code must be 2 characters",
        "any.only": "Invalid country code",
        "any.required": "Country is required",
      }),
    language: Joi.string().valid("en", "fr").optional(),
    admin_secret: Joi.string().optional().messages({
      "string.base": "AAdmin secret must be a string",
    }),
    referral_code: Joi.string().length(8).optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }

  next();
};

/**
 * Validate merchant registration input
 */
const validateMerchantRegistration = (req, res, next) => {
  const schema = Joi.object({
    business_name: Joi.string().min(2).max(255).required().messages({
      "string.min": "Business name must be at least 2 characters",
      "string.max": "Business name cannot exceed 255 characters",
      "any.required": "Business name is required",
    }),
    display_name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Display name must be at least 2 characters",
      "string.max": "Display name cannot exceed 100 characters",
      "any.required": "Display name is required",
    }),
    business_type: Joi.string()
      .valid(
        "retail",
        "service",
        "ecommerce",
        "food",
        "travel",
        "education",
        "entertainment",
        "other"
      )
      .required()
      .messages({
        "any.only":
          "Invalid business type. Must be one of: retail, service, ecommerce, food, travel, education, entertainment, other",
        "any.required": "Business type is required",
      }),
    description: Joi.string().max(1000).optional().allow(""),
    business_email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid business email",
      "any.required": "Business email is required",
    }),
    business_phone: Joi.string().min(10).max(20).required().messages({
      "string.min": "Business phone must be at least 10 characters",
      "string.max": "Business phone cannot exceed 20 characters",
      "any.required": "Business phone is required",
    }),
    country: Joi.string().length(2).uppercase().required().messages({
      "string.length": "Country code must be 2 characters (e.g., NG, KE)",
      "any.required": "Country is required",
    }),
    city: Joi.string().min(2).max(100).required().messages({
      "string.min": "City must be at least 2 characters",
      "string.max": "City cannot exceed 100 characters",
      "any.required": "City is required",
    }),
    address: Joi.string().min(10).required().messages({
      "string.min": "Address must be at least 10 characters",
      "any.required": "Address is required",
    }),
    default_token_type: Joi.string()
      .valid("NT", "CT", "USDT")
      .optional()
      .default("NT")
      .messages({
        "any.only": "Invalid token type. Must be NT, CT, or USDT",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }

  next();
};

/**
 * Validate admin registration input
 */
// const validateAdminRegistration = [
//   ...validateRegistration,
//   body("admin_secret")
//     .notEmpty()
//     .withMessage("Admin secret is required")
//     .isString()
//     .withMessage("Admin secret must be a string"),
// ];

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate token transfer input (regulatory-safe terminology)
 */
const validateTokenTransfer = (req, res, next) => {
  const schema = Joi.object({
    recipient_address: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .messages({
        "string.pattern.base": "Invalid recipient wallet address",
      }),
    recipient_email: Joi.string().email().messages({
      "string.email": "Invalid recipient email",
    }),
    token_type: Joi.string().valid("NT", "CT", "USDT").required().messages({
      "any.only": "Invalid token type. Must be NT, CT, or USDT",
      "any.required": "Token type is required",
    }),
    amount: Joi.number().positive().precision(8).required().messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    note: Joi.string().max(500).optional(),
  })
    .xor("recipient_address", "recipient_email")
    .messages({
      "object.xor": "Provide either recipient address or email, not both",
    });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate token swap input
 */
const validateTokenSwap = (req, res, next) => {
  const schema = Joi.object({
    from_token: Joi.string().valid("NT", "CT", "USDT").required().messages({
      "any.only": "Invalid source token type",
      "any.required": "Source token type is required",
    }),
    to_token: Joi.string().valid("NT", "CT", "USDT").required().messages({
      "any.only": "Invalid destination token type",
      "any.required": "Destination token type is required",
    }),
    amount: Joi.number().positive().precision(8).required().messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    slippage_tolerance: Joi.number()
      .min(0)
      .max(10)
      .optional()
      .default(2)
      .messages({
        "number.min": "Slippage tolerance cannot be negative",
        "number.max": "Slippage tolerance cannot exceed 10%",
      }),
  }).custom((value, helpers) => {
    if (value.from_token === value.to_token) {
      return helpers.error("custom.same", {
        message: "Cannot swap same token types",
      });
    }
    return value;
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate mint request (user acquiring tokens from agent)
 */
const validateMintRequest = (req, res, next) => {
  const schema = Joi.object({
    agent_id: Joi.string().uuid().required().messages({
      "string.guid": "Invalid agent ID format",
      "any.required": "Agent ID is required",
    }),
    token_type: Joi.string().valid("NT", "CT").required().messages({
      "any.only": "Can only acquire NT or CT tokens from agents",
      "any.required": "Token type is required",
    }),
    amount: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    payment_method: Joi.string()
      .valid("bank_transfer", "mobile_money")
      .required()
      .messages({
        "any.only": "Payment method must be bank_transfer or mobile_money",
        "any.required": "Payment method is required",
      }),
    payment_proof_url: Joi.string().uri().optional(),
    payment_reference: Joi.string().max(100).optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate burn request (user exchanging tokens with agent)
 */
const validateBurnRequest = (req, res, next) => {
  const schema = Joi.object({
    agent_id: Joi.string().uuid().required().messages({
      "string.guid": "Invalid agent ID format",
      "any.required": "Agent ID is required",
    }),
    token_type: Joi.string().valid("NT", "CT").required().messages({
      "any.only": "Can only exchange NT or CT tokens with agents",
      "any.required": "Token type is required",
    }),
    amount: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    receive_method: Joi.string()
      .valid("bank_transfer", "mobile_money")
      .required()
      .messages({
        "any.only": "Receive method must be bank_transfer or mobile_money",
        "any.required": "Receive method is required",
      }),
    bank_account_number: Joi.string().when("receive_method", {
      is: "bank_transfer",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    mobile_money_number: Joi.string().when("receive_method", {
      is: "mobile_money",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

/**
 * Validate merchant update input
 */
const validateMerchantUpdate = (req, res, next) => {
  const schema = Joi.object({
    display_name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    business_email: Joi.string().email().optional(),
    business_phone: Joi.string().max(20).optional(),
    city: Joi.string().max(100).optional(),
    address: Joi.string().optional(),
    default_currency: Joi.string().valid("NT", "CT", "USDT").optional(),
    webhook_url: Joi.string().uri().optional(),
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

/**
 * Validate merchant payment request input
 */
const validatePaymentRequest = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required().messages({
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    currency: Joi.string().valid("NT", "CT", "USDT").optional(),
    description: Joi.string().max(500).optional(),
    customer_email: Joi.string().email().optional(),
    reference: Joi.string().max(100).optional(),
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

/**
 * Validate UUID parameter
 */
const validateUUID = (paramName = "id") => {
  return (req, res, next) => {
    const uuid = req.params[paramName];

    const schema = Joi.string().uuid().required();
    const { error } = schema.validate(uuid);

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().optional(),
    order: Joi.string().valid("asc", "desc").default("desc"),
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  // Attach validated pagination to request
  req.pagination = value;
  next();
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;");
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  validateRegistration,
  validateMerchantRegistration,
  // validateAdminRegistration,
  validateLogin,
  validateTokenTransfer,
  validateTokenSwap,
  validateMintRequest,
  validateBurnRequest,
  validateMerchantUpdate,
  validatePaymentRequest,
  validateUUID,
  validatePagination,
  sanitizeInput,
};
