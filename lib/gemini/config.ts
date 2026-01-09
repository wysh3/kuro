import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable or mock key for testing
const apiKey = process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_TESTING';

console.log('🔑 Gemini API Key status:', apiKey === 'MOCK_KEY_FOR_TESTING' ? '❌ MOCK MODE' : '✅ API Key loaded');

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite', // Latest free tier model
    generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
    }
});

export const isMockMode = apiKey === 'MOCK_KEY_FOR_TESTING';
