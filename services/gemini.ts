
import { GoogleGenAI } from "@google/genai";
import { CreatorLead, SearchQuery } from "../types";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (query: SearchQuery, existingUsernames: string[]): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strict search constraints based on user requirements
  const followerConstraint = query.minFollowers !== '0' ? `"${query.minFollowers} followers"` : "";
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  
  // Add signals for quality and activity
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  const excludeUsernames = existingUsernames.length > 0 
    ? existingUsernames.slice(0, 10).map(u => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    Agisci come un analista di database premium. Estrai 6 profili reali e attivi per: "${finalSearchQuery}"
    
    CRITERI DI ESCLUSIONE TASSATIVI (Filtra rigorosamente dai risultati di ricerca):
    1. POSTS: Scarta chiunque abbia meno di 20 post.
    2. FOLLOWERS: Scarta chiunque abbia meno di 300 follower.
    3. REELS: Includi solo profili che mostrano attività Reels (cerca indicatori nei snippet).
    4. FOTO PROFILO: Scarta i profili senza immagine del profilo (se deducibile).
    5. CITTÀ: La città "${query.city}" DEVE essere presente nella bio o nella descrizione del profilo.
    6. PAROLE CHIAVE: La bio DEVE contenere riferimenti espliciti o sinonimi di "${query.role}" o "${query.industry}".
    7. CONTATTI: Deve esserci un'email o un numero di cellulare visibile.

    Per ogni profilo valido, estrai: Nome, Username, URL Profilo, Numero Follower, Bio completa, Email e Telefono.
    
    Restituisci i dati SOLO come array JSON.
    Esempio: [{"name":"..","username":"..","profileUrl":"..","followers":"..","bio":"..","email":"..","phone":"..","category":"..","industry":"..","city":".."}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const leadsRaw: CreatorLead[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Creator Profile",
        uri: chunk.web.uri
      }));

    // Secondary safety filter in JS
    const filteredLeads = leadsRaw
      .filter(lead => 
        ((lead.email && lead.email.includes('@')) || (lead.phone && lead.phone.length > 5)) &&
        !existingUsernames.includes(lead.username) &&
        lead.bio.toLowerCase().includes(query.city.toLowerCase())
      )
      .map((lead, index) => ({
        ...lead,
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`
      }));

    return {
      leads: filteredLeads,
      sources: sources
    };

  } catch (error) {
    console.error("Database Access Error:", error);
    throw error;
  }
};
