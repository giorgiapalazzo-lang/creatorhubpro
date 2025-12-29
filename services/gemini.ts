
import { GoogleGenAI, Type } from "@google/genai";
import { CreatorLead, SearchQuery } from "../types.ts";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (
  query: SearchQuery,
  existingUsernames: string[]
): Promise<SearchResult> => {
  // Inizializzazione diretta con la chiave fornita dall'ambiente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const followerConstraint = query.minFollowers !== '300' ? `"${query.minFollowers} followers"` : '"followers"';
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  const excludeUsernames = existingUsernames && existingUsernames.length > 0 
    ? existingUsernames.slice(0, 15).map((u: string) => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    DASHBOARD ESTRAZIONE LEAD.
    Cerca su Google informazioni aggiornate per: "${finalSearchQuery}"
    
    ESTRAI 6 PROFILI REALI di creator per la categoria "${query.role}" a ${query.city}.
    Assicurati che siano profili attivi e non account spam.
    
    Restituisci i dati in un array JSON. Ogni oggetto deve avere:
    - name: Nome visualizzato
    - username: handle senza @
    - profileUrl: URL completo del profilo
    - followers: numero follower stimato (es. 10k, 500)
    - bio: breve estratto della biografia
    - email: indirizzo email se trovato, altrimenti stringa vuota
    - phone: numero di telefono o WhatsApp se trovato, altrimenti stringa vuota
    - category: ${query.role}
    - city: ${query.city}
    - industry: ${query.industry}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
              city: { type: Type.STRING },
              industry: { type: Type.STRING }
            },
            required: ["name", "username", "profileUrl", "followers", "category", "city", "industry"]
          }
        }
      },
    });

    const text = response.text || "[]";
    const leadsRaw = JSON.parse(text);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Social Source",
        uri: chunk.web.uri
      }));

    const leadsWithIds = leadsRaw.map((lead: any, index: number) => ({
      ...lead,
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`
    }));

    return { leads: leadsWithIds, sources };
  } catch (error: any) {
    console.error("Gemini Search Error:", error);
    throw new Error(error.message || "Errore durante la scansione intelligente dei profili.");
  }
};
