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
      await queryInterface.createTable('agent_wallets', {
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'agents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    try {
      await queryInterface.addConstraint('agent_wallets', {
        fields: ['agent_id', 'wallet_id'],
        type: 'primary key',
        name: 'pk_agent_wallets'
      });
    } catch (e) {
      if (!canSkip(e)) throw e;
    }

    for (const col of [['agent_id'], ['wallet_id']]) {
      try {
        await queryInterface.addIndex('agent_wallets', col);
      } catch (e) {
        if (!canSkip(e)) throw e;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agent_wallets');
  }
};