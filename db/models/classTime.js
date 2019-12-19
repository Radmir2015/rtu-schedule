const timeOfClass = (sequelize, DataTypes) => {
    const Time = sequelize.define('timeOfClass', {      
    //   timeOfClassesId: DataTypes.INTEGER,
      timeOfClass: {
          type: DataTypes.TEXT,
        //   get: function() {
        //     return JSON.parse(this.getDataValue("timeOfClass"));
        //   },
        //   set: function(value) {
        //     return this.setDataValue("timeOfClass", JSON.stringify(value));
        //   }
      },
    //   _timeOfClass: DataTypes.TEXT,

    //   groupId: DataTypes.INTEGER,
    },
    // {
    //     getterMethods: {
    //         timeOfClass: function() {
    //             return JSON.parse(this._timeOfClass);
    //         }
    //     },
    //     setterMethods: {
    //         timeOfClass: function(elem) {
    //             this._timeOfClass = JSON.stringify(elem);
    //         }
    //     }
    // }
    );
  
    Time.associate = function(models) {
        Time.belongsToMany(models.Group, {
            through: models.GroupTime,
            // foreignKey: 'timeGroupId',
            // as: 'times',
            // onDelete: 'CASCADE',
        });
    }

    Time.getLength = () => Time.count();
    Time.dropTable = () => Time.destroy({ where: {}, truncate: true, restartIdentity: true }); // restart auto-increment Id
    Time.deleteOn = (n) => Time.findOne({ offset: n }).then(row => row.destroy());
    Time.getAll = () => Time.findAll().then(table => table.map(row => row.dataValues));
    Time.appendAll = (people) => Time.bulkCreate(people);
  
    return Time;
  };
  
  module.exports = timeOfClass;