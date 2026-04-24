/**
 * Prompt templates for Groq AI
 */

const suggestionPrompt = (customerMessage, chatHistory = [], sentiment = 'neutral') => {
  const history = chatHistory
    .slice(-6)
    .map((m) => `${m.senderType === 'customer' ? 'Customer' : 'Agent'}: ${m.message}`)
    .join('\n');

  const toneInstruction = sentiment === 'angry' 
    ? 'The customer is currently ANGRY. Be extra empathetic, apologetic, and prioritize resolving their frustration.'
    : sentiment === 'happy'
    ? 'The customer is HAPPY. Maintain a friendly and positive tone.'
    : 'Maintain a professional and helpful tone.';

  return `You are a professional customer support agent. ${toneInstruction} 
Based on the conversation below, suggest a helpful and concise reply to the latest customer message.

Conversation history:
${history || 'No prior messages.'}

Latest customer message: "${customerMessage}"

Provide ONLY the reply text (no explanations, no labels, just the reply itself). Keep it under 3 sentences.`;
};

const summaryPrompt = (messages = []) => {
  const conversation = messages
    .map((m) => `[${m.senderType.toUpperCase()}]: ${m.message}`)
    .join('\n');

  return `Summarize the following customer support conversation in 2-3 sentences. Focus on: the customer's issue, resolution attempts, and current status.

Conversation:
${conversation}

Provide ONLY the summary, no labels or explanations.`;
};

const sentimentPrompt = (message) => {
  return `Analyze the sentiment of this customer support message and respond with EXACTLY one word: angry, neutral, or happy.

Message: "${message}"

Response (one word only):`;
};

const classificationPrompt = (message) => {
  return `Classify this customer support message into EXACTLY one of these categories: billing, technical, account, general.

Message: "${message}"

Response (one category word only):`;
};

module.exports = { suggestionPrompt, summaryPrompt, sentimentPrompt, classificationPrompt };
