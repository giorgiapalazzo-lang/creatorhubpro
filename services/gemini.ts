
import { GoogleGenAI } from "@google/genai";
import { CreatorLead, SearchQuery } from "../types";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (query: SearchQuery, existingUsernames: string[]): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const followerConstraint = query.minFollowers !== '300' ? `"${query.minFollowers} followers"` : '"followers"';
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  // Aumentiamo leggermente il raggio di esclusione per evitare duplicati
  const excludeUsernames = existingUsernames.length > 0 
    ? existingUsernames.slice(0, 15).map(u => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    ESTRAZIONE RAPIDA DATI PROFESSIONALI. 
    Analizza i risultati per la query: "${finalSearchQuery}"
    
    OBIETTIVO: Trova ed estrai ESATTAMENTE 6 profili validi che rispettano i seguenti criteri.
    
    REGOLE RIGIDE DI FILTRO:
    1. QUANTITÀ: Devi restituire una lista di 6 profili. Non fermarti a 1 o 2.
    2. FOLLOWERS: Estrai il numero esatto (es. 10.5k, 2.500). Deve essere > 300. Se non trovi il dato, scarta il profilo e cercane un altro.
    3. POSTS: Solo profili con segnali chiari di oltre 20 post pubblicati.
    4. REELS: Deve esserci evidenza di contenuti video/reels nello snippet.
    5. BIO: La città "${query.city}" DEVE essere presente.
    6. CONTATTI: Estrai email o cellulare se visibili. Priorità a chi ha contatti chiari.

    OUTPUT RICHIESTO: Un array JSON con esattamente 6 oggetti.
    Esempio: [{"name":"..","username":"..","profileUrl":"..","followers":"..","bio":"..","email":"..","phone":"..","industry":"${query.industry}","city":"${query.city}"}]
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
        title: chunk.web.title || "Social Link",
        uri: chunk.web.uri
      }));

    const parseFollowers = (f: string): number => {
      if (!f) return 0;
      const clean = f.toLowerCase().replace(/,/g, '').replace(/ followers/g, '').replace(/ seguaci/g, '').trim();
      if (clean.includes('k')) return parseFloat(clean.replace('k', '')) * 1000;
      if (clean.includes('m')) return parseFloat(clean.replace('m', '')) * 1000000;
      return parseInt(clean) || 0;
    };

    // Filtro secondario lato client per sicurezza, ma meno restrittivo per non svuotare la lista se il modello ha già filtrato
    const filteredLeads = leadsRaw
      .filter(lead => {
        const hasContact = (lead.email?.includes('@') || lead.phone?.length > 5);
        const followerValue = parseFollowers(lead.followers);
        const meetsCriteria = followerValue >= 300;
        const notDuplicate = !existingUsernames.includes(lead.username);
        
        return notDuplicate; // Diamo priorità a mostrare i 6 risultati trovati dal modello
      })
      .map((lead, index) => ({
        ...lead,
        id: `${Date.now()}-${index}`
      }));

    return {
      leads: filteredLeads,
      sources: sources
    };

  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
};
