'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'merchant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'merchants',
        key: 'id'
      }
    });

    await queryInterface.addColumn('transactions', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'payment_details', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'receipt_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addIndex('transactions', ['merchant_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('transactions', ['merchant_id']);
    await queryInterface.removeColumn('transactions', 'receipt_url');
    await queryInterface.removeColumn('transactions', 'payment_details');
    await queryInterface.removeColumn('transactions', 'payment_method');
    await queryInterface.removeColumn('transactions', 'merchant_id');
  }
};