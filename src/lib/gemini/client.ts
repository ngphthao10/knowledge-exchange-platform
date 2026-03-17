import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-8b',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})

export const geminiChat = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-8b',
})
