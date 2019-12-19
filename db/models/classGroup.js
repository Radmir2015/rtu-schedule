const classGroup = (sequelize, DataTypes) => {
    const ClassGroup = sequelize.define('classGroup', {});

    return ClassGroup;
}

module.exports = classGroup;