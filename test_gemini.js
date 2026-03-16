import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent("hello, say hi back")
    const response = await result.response
    console.log("SUCCESS:", response.text())
  } catch (e) {
    console.error("ERROR:", e)
  }
}

test()
