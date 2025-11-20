import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDigit = async (base64Image: string): Promise<RecognitionResult> => {
  // Remove the data URL prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this handwritten digit. 
            1. Identify the number (0-9).
            2. Provide a confidence score for every digit from 0 to 9 (array of 10 numbers, summing to 1.0).
            3. Explain briefly (under 30 words) why you think it is that number based on visual features (loops, stems, curves).
            4. Describe which parts of the image were most important (feature map description) in 1 sentence.
            
            Return strictly JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.INTEGER, description: "The predicted digit 0-9" },
            probabilities: { 
              type: Type.ARRAY, 
              items: { type: Type.NUMBER },
              description: "Array of 10 floats representing probability for digits 0, 1, 2... 9"
            },
            explanation: { type: Type.STRING, description: "Reasoning for the prediction" },
            featureMapDescription: { type: Type.STRING, description: "Description of active visual features" }
          },
          required: ["prediction", "probabilities", "explanation", "featureMapDescription"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as RecognitionResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback mock data in case of API failure to prevent app crash during demo
    return {
      prediction: -1,
      probabilities: Array(10).fill(0.1),
      explanation: "Failed to connect to the neural network API. Please check your API Key.",
      featureMapDescription: "Error analyzing features."
    };
  }
};