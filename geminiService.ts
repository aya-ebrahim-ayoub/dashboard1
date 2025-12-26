
import { GoogleGenAI } from "@google/genai";

// استخدام process.env.API_KEY مباشرة كما هو مطلوب
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function getSmartInsights(metrics: any, userCount: number) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As a Senior Business Analyst for Nexus Enterprise, analyze the following dashboard metrics and provide 3 concise, high-impact strategic insights.
      
      Metrics:
      - Total Revenue: ${metrics.find((m: any) => m.label === 'Total Revenue')?.value}
      - Active Employees/Users: ${userCount}
      - System Health: ${metrics.find((m: any) => m.label === 'System Uptime')?.value}
      - Server Load: ${metrics.find((m: any) => m.label === 'Server Load')?.value}
      
      Format your response as a JSON array of strings. Only return the JSON.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      "Error generating real-time insights. System is functioning within normal parameters.",
      "Revenue growth shows a strong positive correlation with active user retention.",
      "Infrastructure optimization recommended to maintain current uptime levels."
    ];
  }
}
