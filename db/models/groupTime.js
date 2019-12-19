const groupTime = (sequelize, DataTypes) => {
    const GroupTime = sequelize.define('groupTime', {});

    return GroupTime;
}

module.exports = groupTime;