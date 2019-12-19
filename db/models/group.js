const group = (sequelize, DataTypes) => {
    const Group = sequelize.define('group', {
      groupName: DataTypes.STRING,
      fullGroupName: DataTypes.STRING,
      
    //   timeGroupId: DataTypes.INTEGER,
    //   timeOfClassesId: DataTypes.INTEGER,
    });
  
    Group.associate = function(models) {
        Group.belongsToMany(models.Class, {
            through: models.ClassGroup,
            // foreignKey: 'groupId',
            // as: 'classes',
            // onDelete: 'CASCADE',
        });

        Group.belongsToMany(models.Time, {
            through: models.GroupTime,
            // foreignKey: 'timeGroupId',
            // as: 'groupOwner',
            // onDelete: 'CASCADE',
        });
    }

    Group.getLength = () => Group.count();
    Group.dropTable = () => Group.destroy({ where: {}, truncate: true, restartIdentity: true }); // restart auto-increment Id
    Group.deleteOn = (n) => Group.findOne({ offset: n }).then(row => row.destroy());
    Group.getAll = () => Group.findAll().then(table => table.map(row => row.dataValues));
    Group.appendAll = (people) => Group.bulkCreate(people);
  
    return Group;
  };
  
  module.exports = group;