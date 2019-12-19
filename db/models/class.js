const classObj = (sequelize, DataTypes) => {
    const Class = sequelize.define('class', {
      name: DataTypes.STRING,
      teacher: DataTypes.STRING,
      type: DataTypes.STRING,
      classRoom: DataTypes.STRING,
      
      evenness: DataTypes.STRING,
      weekDay: DataTypes.STRING,
      classNumber: DataTypes.STRING,

    //   timeId: DataTypes.INTEGER,
      // groupId: DataTypes.INTEGER,
    });
  
    Class.associate = function(models) {
        Class.belongsToMany(models.Group, {
            through: models.ClassGroup,
            // foreignKey: 'groupId',
            // as: 'classOwner',
            // onDelete: 'CASCADE',
        });

        // Class.belongsTo(models.Time, {
        //     foreignKey: 'timeId',
        //     as: 'classTime',
        //     onDelete: 'CASCADE',
        // });
    }

    Class.getLength = () => Class.count();
    Class.dropTable = () => Class.destroy({ where: {}, truncate: true, restartIdentity: true }); // restart auto-increment Id
    Class.deleteOn = (n) => Class.findOne({ offset: n }).then(row => row.destroy());
    Class.getAll = () => Class.findAll().then(table => table.map(row => row.dataValues));
    Class.appendAll = (people) => Class.bulkCreate(people);
  
    return Class;
  };
  
  module.exports = classObj;