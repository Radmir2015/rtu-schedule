const Sequelize = require('sequelize');

console.log(process.env.DATABASE);

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
  },
);

const models = {
  GroupTime: sequelize.import('./models/groupTime'),
  ClassGroup: sequelize.import('./models/classGroup'),
  Group: sequelize.import('./models/group'),
  Class: sequelize.import('./models/class'),
  Time: sequelize.import('./models/classTime'),
};

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

module.exports = { Sequelize, sequelize, models };