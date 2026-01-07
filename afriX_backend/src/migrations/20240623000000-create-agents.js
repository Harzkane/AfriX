'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('agents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      business_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tier: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      business_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      business_phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      deposit_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1.00
      },
      max_transaction_limit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      daily_transaction_limit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      supported_payment_methods: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      total_transactions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      transaction_volume: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      verification_status: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      verification_documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      referral_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      referred_users_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('agents', ['user_id'], {
      unique: true
    });
    await queryInterface.addIndex('agents', ['verification_status']);
    await queryInterface.addIndex('agents', ['country', 'city']);
    await queryInterface.addIndex('agents', ['tier']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agents');
  }
};