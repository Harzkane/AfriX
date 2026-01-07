// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/paymentVerificationService.js

const { Transaction, Merchant } = require('../models');
const { TRANSACTION_STATUS } = require('../utils/constants');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Service for payment verification operations
 */
const paymentVerificationService = {
  /**
   * Verify a payment by transaction ID
   * @param {String} transactionId - Transaction ID to verify
   * @returns {Object} Verification result
   */
  async verifyPayment(transactionId) {
    const transaction = await Transaction.findByPk(transactionId);
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Check transaction status
    const isVerified = transaction.status === TRANSACTION_STATUS.COMPLETED;
    
    return {
      transaction_id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      verified: isVerified,
      timestamp: transaction.created_at
    };
  },
  
  /**
   * Verify payment by merchant reference
   * @param {String} merchantId - Merchant ID
   * @param {String} reference - Transaction reference
   * @returns {Object} Verification result
   */
  async verifyPaymentByReference(merchantId, reference) {
    // Find merchant
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      throw new ApiError('Merchant not found', 404);
    }
    
    // Find transaction by reference
    const transaction = await Transaction.findOne({
      where: { 
        reference,
        to_user_id: merchant.user_id
      }
    });
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Check transaction status
    const isVerified = transaction.status === TRANSACTION_STATUS.COMPLETED;
    
    return {
      transaction_id: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      verified: isVerified,
      timestamp: transaction.created_at
    };
  },
  
  /**
   * Send webhook notification for payment status
   * @param {String} transactionId - Transaction ID
   * @returns {Boolean} Success status
   */
  async sendWebhookNotification(transactionId) {
    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          {
            model: User,
            as: 'toUser',
            include: [
              {
                model: Merchant
              }
            ]
          }
        ]
      });
      
      if (!transaction || !transaction.toUser || !transaction.toUser.Merchant) {
        logger.error(`Cannot send webhook: Transaction ${transactionId} not found or not a merchant payment`);
        return false;
      }
      
      const merchant = transaction.toUser.Merchant;
      
      // Skip if no webhook URL configured
      if (!merchant.webhook_url) {
        return false;
      }
      
      // Prepare webhook payload
      const payload = {
        event: 'payment.updated',
        transaction_id: transaction.id,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        timestamp: new Date().toISOString()
      };
      
      // Send webhook notification (implementation would use axios or similar)
      // This is a placeholder for actual implementation
      logger.info(`Sending webhook to ${merchant.webhook_url} for transaction ${transaction.id}`);
      
      return true;
    } catch (error) {
      logger.error(`Webhook notification error: ${error.message}`);
      return false;
    }
  }
};

module.exports = paymentVerificationService;