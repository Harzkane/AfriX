'use strict';

/** Return true if migration step can be skipped (idempotent). */
function canSkip(err) {
  const msg = (err && (err.message || err.original?.message || '')) || '';
  const code = err && (err.parent?.code || err.original?.code);
  return (
    code === '42P07' || /* relation already exists */
    code === '42703' || /* column does not exist (table has different schema) */
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('does not exist')
  );
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
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
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    } catch (e) {
      if (!canSkip(e)) throw e;
    }

    // Add indexes (idempotent: skip if index or column already exists / missing)
    const indexes = [
      { columns: ['user_id'], options: { unique: true } },
      { columns: ['verification_status'] },
      { columns: ['country', 'city'] },
      { columns: ['tier'] },
    ];
    for (const { columns, options = {} } of indexes) {
      try {
        await queryInterface.addIndex('agents', columns, options);
      } catch (e) {
        if (!canSkip(e)) throw e;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agents');
  }
};