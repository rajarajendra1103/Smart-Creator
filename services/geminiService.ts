import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResumeSummary = async (role: string, years: string, skills: string): Promise<string> => {
  try {
    const prompt = `Write a professional, concise (max 3 sentences) resume summary for a ${role} with ${years} years of experience. Key skills include: ${skills}. Do not include any introductory text, just the summary.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while generating the summary.";
  }
};

export const generateCardTagline = async (role: string, industry: string): Promise<string> => {
  try {
    const prompt = `Create a short, punchy, professional tagline (max 6 words) for a visiting card. Role: ${role}. Industry: ${industry}. No quotes.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const generateExperienceDescription = async (role: string, company: string): Promise<string> => {
  try {
    const prompt = `Write a professional bulleted list (3-4 points) of achievements for a ${role} at ${company}. Use active verbs and professional tone. Return plain text with bullets.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const polishText = async (text: string): Promise<string> => {
  try {
    const prompt = `Rewrite the following text to be more professional, concise, and impactful for a business card or resume: "${text}". Return only the rewritten text.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text;
  }
};
