const { sequelize } = require('../config/db');
const Company = require('./Company');
const User = require('./User');
const Chat = require('./Chat');
const Message = require('./Message');
const Ticket = require('./Ticket');
const AILog = require('./AILog');

// Associations
Company.hasMany(User, { foreignKey: 'companyId', onDelete: 'CASCADE' });
User.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(Chat, { foreignKey: 'companyId', onDelete: 'CASCADE' });
Chat.belongsTo(Company, { foreignKey: 'companyId' });

Chat.hasMany(Message, { foreignKey: 'chatId', onDelete: 'CASCADE' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });

Chat.hasOne(Ticket, { foreignKey: 'chatId', onDelete: 'CASCADE' });
Ticket.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

Chat.hasMany(AILog, { foreignKey: 'chatId', onDelete: 'CASCADE' });
AILog.belongsTo(Chat, { foreignKey: 'chatId' });

module.exports = {
  sequelize,
  Company,
  User,
  Chat,
  Message,
  Ticket,
  AILog,
};
