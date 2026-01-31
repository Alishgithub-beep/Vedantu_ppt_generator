
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChapterContent, Slide } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateChapterContent = async (pdfBase64: string, styleBase64?: string, styleMimeType?: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const model = "gemini-3-pro-preview";
    
    let prompt = `
      Analyze the provided Class 10 educational PDF chapter. 
      Create a comprehensive presentation deck structure suitable for Vedantu students.
      The deck MUST be structured as follows:
      1. Slide 0: A 'TITLE' type slide containing the chapter title and subject.
      2. Slides 1 to 6: 'CONTENT' type slides explaining topics. 
         - Each MUST have a detailed explanation.
         - Each MUST have an 'imagePrompt' that describes a highly detailed, LABELLED educational diagram or conceptual visual specific to that topic. 
         - The imagePrompt should specify: "Create a clean, professional, textbook-style labelled diagram of [Topic]...".
      3. Last 5 Slides: 'QUIZ' type slides. Each must contain 'quizData' with a question, 4 options, correctAnswer index, and explanation.

      Ensure the language is student-friendly for Vedantu students.
    `;

    if (styleBase64) {
      prompt += `
      CRITICAL: I have provided a "Style Sample". Mimic its visual hierarchy, tone, and complexity.
      Identify primary branding colors and return them in the 'theme' object.
      `;
    }

    const chapterPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf"
      }
    };

    const parts: any[] = [chapterPart, { text: prompt }];

    if (styleBase64 && styleMimeType) {
      parts.push({
        inlineData: {
          data: styleBase64,
          mimeType: styleMimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapterTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            theme: {
              type: Type.OBJECT,
              properties: {
                primaryColor: { type: Type.STRING },
                secondaryColor: { type: Type.STRING },
                textColor: { type: Type.STRING },
                backgroundColor: { type: Type.STRING },
                accentColor: { type: Type.STRING }
              },
              required: ["primaryColor", "secondaryColor", "textColor", "backgroundColor", "accentColor"]
            },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["TITLE", "CONTENT", "QUIZ"] },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  imagePrompt: { type: Type.STRING },
                  quizData: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.INTEGER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswer", "explanation"]
                  }
                },
                required: ["id", "type", "title"]
              }
            }
          },
          required: ["chapterTitle", "subject", "slides", "theme"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (error) {
      throw new Error("Invalid response format from AI");
    }
  });
};

export const generateSlideImage = async (imagePrompt: string, subject: string): Promise<string> => {
  return withRetry(async () => {
    // We use gemini-2.5-flash-image for faster image generation
    const model = 'gemini-2.5-flash-image';
    const enhancedPrompt = `${imagePrompt}. Detailed, professional educational diagram, high-quality, clear labels, white background, suitable for Class 10 ${subject} students.`;
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: enhancedPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  });
};
