const { TRANSACTION_TYPES } = require("../config/constants");

function asPlainTransaction(tx) {
  if (!tx) return null;
  return typeof tx.toJSON === "function" ? tx.toJSON() : { ...tx };
}

function annotateTransactionFee(tx) {
  const plain = asPlainTransaction(tx);
  if (!plain) return plain;

  const feeValue = plain.fee ?? 0;
  const feeNumber = parseFloat(feeValue || 0);
  const hasFee = feeNumber > 0;
  const isAgentExchange =
    [TRANSACTION_TYPES.MINT, TRANSACTION_TYPES.BURN].includes(plain.type) &&
    !!plain.agent_id;
  const hasPlatformFeeWallet = !!plain.fee_wallet_id;

  let feeKind = "none";
  let feeLabel = null;

  if (hasFee && hasPlatformFeeWallet) {
    feeKind = "platform_fee";
    feeLabel = "Platform Fee";
  } else if (hasFee && isAgentExchange) {
    feeKind = "agent_commission";
    feeLabel = "Agent Commission";
  } else if (hasFee) {
    feeKind = "transaction_fee";
    feeLabel = "Transaction Fee";
  }

  return {
    ...plain,
    fee_amount: feeValue,
    fee_kind: feeKind,
    fee_label: feeLabel,
    platform_fee: feeKind === "platform_fee" || feeKind === "transaction_fee" ? feeValue : 0,
    agent_commission: feeKind === "agent_commission" ? feeValue : 0,
  };
}

function sumFeeValues(rows = []) {
  return rows.reduce((sum, row) => sum + (parseFloat(row?.fee || 0) || 0), 0);
}

module.exports = {
  annotateTransactionFee,
  sumFeeValues,
};
