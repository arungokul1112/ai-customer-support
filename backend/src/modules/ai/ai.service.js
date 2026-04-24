const Groq = require('groq-sdk');
const { AILog } = require('../../models');
const { suggestionPrompt, summaryPrompt, sentimentPrompt, classificationPrompt } = require('./prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Core Groq call helper
 */
const callGroq = async (prompt, maxTokens = 300) => {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return {
    text: completion.choices[0]?.message?.content?.trim() || '',
    tokensUsed: completion.usage?.total_tokens || 0,
  };
};

/**
 * Log AI call to database
 */
const logAI = async (chatId, type, prompt, response, tokensUsed) => {
  try {
    await AILog.create({ chatId, type, prompt, response, model: MODEL, tokensUsed });
  } catch (e) {
    console.warn('Failed to log AI interaction:', e.message);
  }
};

/**
 * Local sentiment pre-check (fallback for AI failure or profanity)
 */
const localSentimentCheck = (message) => {
  const text = message.toLowerCase();
  const angryWords = ['fuck', 'shit', 'hate', 'terrible', 'awful', 'worst', 'stupid', 'useless', 'refund', 'unacceptable'];
  const happyWords = ['love', 'great', 'awesome', 'excellent', 'thanks', 'thank you', 'amazing', 'perfect', 'happy'];

  if (angryWords.some(word => text.includes(word))) return 'angry';
  if (happyWords.some(word => text.includes(word))) return 'happy';
  return null;
};

/**
 * Generate a reply suggestion for agent
 */
const generateReply = async (chatId, customerMessage, chatHistory = [], sentiment = 'neutral') => {
  try {
    const prompt = suggestionPrompt(customerMessage, chatHistory, sentiment);
    const { text, tokensUsed } = await callGroq(prompt, 200);
    await logAI(chatId, 'suggestion', prompt, text, tokensUsed);
    return text;
  } catch (err) {
    console.error('Groq generateReply error:', err.message);
    // Dynamic fallback based on sentiment
    if (sentiment === 'angry') {
      return "I sincerely apologize for the frustration this has caused. I'm looking into this right now to make it right.";
    }
    return 'I understand your concern. Let me look into this for you right away.';
  }
};

/**
 * Summarize a chat conversation
 */
const summarizeChat = async (chatId, messages = []) => {
  try {
    const prompt = summaryPrompt(messages);
    const { text, tokensUsed } = await callGroq(prompt, 200);
    await logAI(chatId, 'summary', prompt, text, tokensUsed);
    return text;
  } catch (err) {
    console.error('Groq summarizeChat error:', err.message);
    return 'Summary unavailable at this time.';
  }
};

/**
 * Detect sentiment from a message
 */
const detectSentiment = async (chatId, message) => {
  // 1. Local Pre-check (Immediate results for obvious cases)
  const localResult = localSentimentCheck(message);
  
  try {
    const prompt = sentimentPrompt(message);
    const { text, tokensUsed } = await callGroq(prompt, 10);
    const textLower = text.toLowerCase();
    
    let result = 'neutral';
    if (textLower.includes('angry')) result = 'angry';
    else if (textLower.includes('happy')) result = 'happy';
    
    // If AI failed to detect but local check found something, prefer local (e.g. for profanity)
    if (result === 'neutral' && localResult) result = localResult;

    await logAI(chatId, 'sentiment', prompt, result, tokensUsed);
    return result;
  } catch (err) {
    console.error('Groq detectSentiment error:', err.message);
    return localResult || 'neutral';
  }
};

/**
 * Classify the issue type
 */
const classifyIssue = async (chatId, message) => {
  try {
    const prompt = classificationPrompt(message);
    const { text, tokensUsed } = await callGroq(prompt, 10);
    const category = text.toLowerCase().replace(/[^a-z]/g, '');
    const valid = ['billing', 'technical', 'account', 'general'];
    const result = valid.includes(category) ? category : 'general';
    await logAI(chatId, 'classification', prompt, result, tokensUsed);
    return result;
  } catch (err) {
    console.error('Groq classifyIssue error:', err.message);
    return 'general';
  }
};

module.exports = { generateReply, summarizeChat, detectSentiment, classifyIssue };
