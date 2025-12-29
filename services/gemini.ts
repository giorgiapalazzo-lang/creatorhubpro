
import { GoogleGenAI, Type } from "@google/genai";
import { SearchQuery, CreatorLead } from "../types";

export const searchCreators = async (query: SearchQuery): Promise<CreatorLead[]> => {
  // Inizializzazione standard come richiesto dalle linee guida
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Trova una lista di almeno 5-10 creator o influencer reali su Instagram che corrispondono a questi criteri:
    - Ruolo: ${query.role}
    - Settore: ${query.industry}
    - Città: ${query.city}
    
    Per ogni profilo estrai con precisione:
    1. Nome completo e Username (@username)
    2. URL profilo Instagram (https://www.instagram.com/username/)
    3. Numero di follower (es. 10.5k, 1M)
    4. Bio estratta dal profilo
    5. Email di contatto (estrapola dalla bio o dai dati pubblici)
    6. Numero di telefono (se presente)
    
    Ritorna i dati ESCLUSIVAMENTE in formato JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              username: { type: Type.STRING },
              profileUrl: { type: Type.STRING },
              followers: { type: Type.STRING },
              bio: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              category: { type: Type.STRING },
              industry: { type: Type.STRING },
              city: { type: Type.STRING },
            },
            required: ["username", "profileUrl"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Risposta vuota dall'IA");
    
    const results = JSON.parse(text);
    return results.map((r: any) => ({
      ...r,
      id: Math.random().toString(36).substr(2, 9),
      category: query.role,
      industry: query.industry,
      city: query.city
    }));
  } catch (error) {
    console.error("Errore durante la ricerca AI:", error);
    throw error;
  }
};
