'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class AllEvents extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
    }
  }
  AllEvents.init({
    eventImg: DataTypes.STRING,
    eventTitle: DataTypes.STRING,
    eventDesc: DataTypes.STRING,
    eventVenue: DataTypes.STRING,
    eventCapacity: DataTypes.INTEGER,
    eventStartDate: DataTypes.STRING,
    eventTime: DataTypes.STRING,
    eventEndDate: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AllEvents'
  })
  return AllEvents
}
