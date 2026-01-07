'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('merchants', {
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
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      business_type: {
        type: Sequelize.ENUM(
          'retail', 'ecommerce', 'service', 'food', 
          'travel', 'education', 'entertainment', 'other'
        ),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(255),
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
        allowNull: false
      },
      settlement_wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      default_currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'NT'
      },
      payment_fee_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.00
      },
      verification_status: {
        type: Sequelize.ENUM(
          'pending', 'approved', 'active', 
          'inactive', 'suspended', 'banned'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      verification_documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      api_key: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      webhook_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('merchants', ['user_id', 'business_name'], {
      unique: true,
      name: 'merchants_user_business_unique'
    });
    
    await queryInterface.addIndex('merchants', ['business_name'], {
      name: 'merchants_business_name_idx'
    });
    
    await queryInterface.addIndex('merchants', ['verification_status'], {
      name: 'merchants_verification_status_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('merchants');
  }
};