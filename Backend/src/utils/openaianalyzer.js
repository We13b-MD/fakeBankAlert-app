import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAIKEY,
});

export const analyzeAlertWithAi = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Valid text input is required');
  }

  const prompt = `
You are a fraud detection system.

Analyze the bank alert text below and classify it.

Return ONLY valid JSON in this format: 
{
  "verdict": "real" | "likely_fake",
  "confidence": number between 0 and 1,
  "explanation": "short reason"
}

Alert text:
"${text.replace(/"/g, '\\"')}"  // Also escape quotes to prevent JSON issues
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You analyze bank alerts for fraud." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
};
/*const client = new OpenAI({
  apiKey: process.env.OPENAIKEY,
});

export const analyzeAlertWithAi = async (text) => { 
  const prompt = `
You are a fraud detection system.

Analyze the bank alert text below and classify it.

Return ONLY valid JSON in this format: 
{
  "verdict": "real" | "likely_fake",
  "confidence": number between 0 and 1,
  "explanation": "short reason"
}

Alert text:
"${text}"
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You analyze bank alerts for fraud." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
};*/
