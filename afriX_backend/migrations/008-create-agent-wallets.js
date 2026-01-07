'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    await queryInterface.addConstraint('agent_wallets', {
      fields: ['agent_id', 'wallet_id'],
      type: 'primary key',
      name: 'pk_agent_wallets'
    });

    await queryInterface.addIndex('agent_wallets', ['agent_id']);
    await queryInterface.addIndex('agent_wallets', ['wallet_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('agent_wallets');
  }
};