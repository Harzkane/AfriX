'use strict';

function canSkip(err) {
  const msg = (err && (err.message || err.original?.message || '')) || '';
  const code = err && (err.parent?.code || err.original?.code);
  return (
    code === '42P07' ||
    code === '42703' ||
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('does not exist')
  );
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
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
    } catch (e) {
      if (!canSkip(e)) throw e;
    }

    const indexes = [
      { columns: ['user_id', 'business_name'], options: { unique: true, name: 'merchants_user_business_unique' } },
      { columns: ['business_name'], options: { name: 'merchants_business_name_idx' } },
      { columns: ['verification_status'], options: { name: 'merchants_verification_status_idx' } },
    ];
    for (const { columns, options } of indexes) {
      try {
        await queryInterface.addIndex('merchants', columns, options);
      } catch (e) {
        if (!canSkip(e)) throw e;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('merchants');
  }
};