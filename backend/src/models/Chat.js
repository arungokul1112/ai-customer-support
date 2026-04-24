const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  sentiment: {
    type: DataTypes.ENUM('angry', 'neutral', 'happy'),
    defaultValue: 'neutral',
  },
  lastAISuggestion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'chats',
  timestamps: true,
});

module.exports = Chat;
