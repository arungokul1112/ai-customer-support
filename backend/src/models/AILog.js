const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AILog = sequelize.define('AILog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // suggestion / summary / sentiment / classification
    allowNull: false,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
    defaultValue: 'groq',
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'ai_logs',
  timestamps: true,
});

module.exports = AILog;
