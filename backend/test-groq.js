require('dotenv').config();
const { detectSentiment, generateReply } = require('./src/modules/ai/ai.service');

(async () => {
  try {
    console.log('--- Groq AI Integration Test ---');
    console.log('API Key configured:', !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
    
    const { connectDB } = require('./src/config/db');
    await connectDB();

    console.log('\n1. Testing Sentiment Detection (Profanity/Angry):');
    const sentimentAngry = await detectSentiment('test-id', 'This is fucking terrible service!');
    console.log('Result:', sentimentAngry);

    console.log('\n2. Testing Sentiment Detection (Happy):');
    const sentimentHappy = await detectSentiment('test-id', 'I love this service, thank you!');
    console.log('Result:', sentimentHappy);

    console.log('\n3. Testing Reply Suggestion (Angry context):');
    const suggestion = await generateReply('test-id', 'I want a refund now!', [], 'angry');
    console.log('Suggestion:', suggestion);

    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
