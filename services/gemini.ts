
import { GoogleGenAI } from "@google/genai";
import { CreatorLead, SearchQuery } from "../types";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (query: SearchQuery, existingUsernames: string[]): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strict search constraints based on user requirements
  const followerConstraint = query.minFollowers !== '300' ? `"${query.minFollowers} followers"` : '"followers"';
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  
  // Add signals for quality and activity
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  const excludeUsernames = existingUsernames.length > 0 
    ? existingUsernames.slice(0, 15).map(u => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    Agisci come un analista di database premium specializzato in social media. 
    Estrai 6 profili reali e attivi per la query: "${finalSearchQuery}"
    
    REGOLE DI ESTRAZIONE RIGOROSE (Analizza gli snippet di Google):
    1. FOLLOWERS: Estrai il numero ESATTO di follower citato nello snippet (es. "12.5k", "500", "1.2M"). 
       NON inventare il numero. Se non è presente, scarta il profilo.
       REQUISITO: Deve essere superiore a 300.
    2. POSTS: Il profilo deve avere indicatori di almeno 20 post.
    3. CONTATTI: Deve esserci un'email o un numero di cellulare (cerca pattern come @gmail.com o +39).
    4. CITTÀ: La città "${query.city}" deve essere menzionata esplicitamente nella bio o nel testo del risultato.
    5. ATTIVITÀ: Cerca riferimenti a "Reels" o "Video" per confermare l'uso dei nuovi formati.

    DETTAGLI OUTPUT:
    - name: Nome visualizzato
    - username: Handle del profilo (senza @)
    - profileUrl: Link diretto
    - followers: Stringa esatta dei follower (es. "10.2k")
    - bio: Il testo della bio o lo snippet descrittivo
    - email: Email estratta (se presente)
    - phone: Telefono estratto (se presente)
    - industry: "${query.industry}"
    - city: "${query.city}"

    Restituisci i dati SOLO come array JSON valido.
    Esempio: [{"name":"Mario Rossi","username":"mariorossi_ugc","profileUrl":"https://instagram.com/mariorossi_ugc","followers":"15.4k","bio":"UGC Creator a Napoli...","email":"mario@gmail.com","phone":"+39333...","industry":"Beauty","city":"Napoli"}]
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

    // Improved secondary filter to handle follower strings like "10k"
    const parseFollowers = (f: string): number => {
      const clean = f.toLowerCase().replace(/,/g, '').replace(/ followers/g, '').trim();
      if (clean.includes('k')) return parseFloat(clean.replace('k', '')) * 1000;
      if (clean.includes('m')) return parseFloat(clean.replace('m', '')) * 1000000;
      return parseInt(clean) || 0;
    };

    const filteredLeads = leadsRaw
      .filter(lead => {
        const hasContact = ((lead.email && lead.email.includes('@')) || (lead.phone && lead.phone.length > 5));
        const notDuplicate = !existingUsernames.includes(lead.username);
        const followerCount = parseFollowers(lead.followers);
        const meetsFollowers = followerCount >= 300;
        
        return hasContact && notDuplicate && meetsFollowers;
      })
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
