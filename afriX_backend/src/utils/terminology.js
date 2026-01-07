// terminology.js

/**
 * Regulatory-Safe Terminology
 * 
 * CRITICAL: All API responses, error messages, and UI text MUST use
 * approved terminology to avoid financial services classification.
 */

const APPROVED_TERMS = {
  // Core Platform Terms
  platform: ['platform', 'marketplace', 'exchange', 'swap'],
  
  // Token Terms (USE THESE)
  tokens: ['token', 'digital asset', 'NT', 'CT', 'USDT', 'balance', 'value'],
  
  // User Actions (USE THESE)
  actions: ['acquire', 'obtain', 'send', 'receive', 'transfer', 'exchange', 'swap', 'convert'],
  
  // User Management (USE THESE)
  users: ['profile', 'wallet', 'address', 'user', 'participant', 'member'],
  
  // Agent Terms (USE THESE)
  agents: ['agent', 'facilitator', 'service provider', 'liquidity provider'],
  
  // Transaction Terms (USE THESE)
  transactions: ['transaction', 'activity', 'record', 'history', 'confirmation'],
  
  // Fee Terms (USE THESE)
  fees: ['platform fee', 'service fee', 'network fee', 'transaction fee']
};

const PROHIBITED_TERMS = {
  // Banking & Financial (NEVER USE)
  banking: ['bank', 'banking', 'account', 'financial service', 'financial institution'],
  
  // Money & Currency (NEVER USE)
  money: ['money', 'currency', 'cash', 'funds', 'capital', 'legal tender'],
  
  // Payment (NEVER USE)
  payment: ['payment', 'pay', 'remittance', 'send money', 'receive payment'],
  
  // Deposits & Withdrawals (NEVER USE)
  banking_actions: ['deposit', 'withdraw', 'withdrawal', 'cash out', 'top up', 'load money'],
  
  // Investment (NEVER USE)
  investment: ['investment', 'invest', 'return', 'profit', 'interest', 'yield', 'dividend'],
  
  // Credit (NEVER USE)
  credit: ['loan', 'lend', 'borrow', 'credit', 'debt'],
  
  // Regulatory Claims (NEVER USE)
  regulatory: ['licensed', 'regulated', 'approved', 'insured', 'guaranteed']
};

// Safe replacements
const TERM_REPLACEMENTS = {
  'payment': 'token transfer',
  'deposit': 'acquire tokens',
  'withdraw': 'exchange tokens',
  'money': 'tokens',
  'account': 'profile',
  'bank account': 'wallet'
};

module.exports = {
  APPROVED_TERMS,
  PROHIBITED_TERMS,
  TERM_REPLACEMENTS
};