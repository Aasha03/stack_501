'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AllEvents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eventImg: {
        type: Sequelize.STRING
      },
      eventTitle: {
        type: Sequelize.STRING
      },
      eventDesc: {
        type: Sequelize.STRING
      },
      eventVenue: {
        type: Sequelize.STRING
      },
      eventCapacity: {
        type: Sequelize.INTEGER
      },
      eventStartDate: {
        type: Sequelize.STRING
      },
      eventTime: {
        type: Sequelize.STRING
      },
      eventEndDate: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AllEvents');
  }
};