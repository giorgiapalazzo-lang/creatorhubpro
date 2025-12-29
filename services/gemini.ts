
import { GoogleGenAI } from "@google/genai";
import { CreatorLead, SearchQuery } from "../types";

export interface SearchResult {
  leads: CreatorLead[];
  sources: { title: string; uri: string }[];
}

export const searchCreators = async (query: SearchQuery, existingUsernames: string[]): Promise<SearchResult> => {
  // Upgrading to Pro for better accuracy on complex parsing of snippets (followers/posts)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const followerConstraint = query.minFollowers !== '300' ? `"${query.minFollowers} followers"` : '"followers"';
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  const excludeUsernames = existingUsernames.length > 0 
    ? existingUsernames.slice(0, 15).map(u => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    Agisci come un analista di database certificato. 
    Estrai 6 profili reali e attivi per la query: "${finalSearchQuery}"
    
    ISTRUZIONI CRITICHE PER L'ACCURATEZZA DEI DATI:
    1. FOLLOWERS: Estrai SOLO il numero di follower esplicitamente indicato nel testo dello snippet di Google. 
       - Se vedi "10.5k followers", scrivi "10.5k". 
       - Se vedi "500 seguaci", scrivi "500". 
       - NON inventare o stimare il numero se non è presente. Se non lo trovi, scarta il profilo.
       - Deve essere rigorosamente >= 300.
    2. POSTS: Cerca indicatori numerici (es. "45 posts") e assicurati che siano > 20.
    3. CONTATTI: Estrai email o telefono solo se presenti nel testo pubblico.
    4. CITTÀ: Verifica che "${query.city}" sia presente nella biografia.
    5. CATEGORIA: Verifica la pertinenza con "${query.industry}".

    FORMATO RICHIESTO: JSON ARRAY
    Esempio: [{"name":"Nome","username":"user","profileUrl":"URL","followers":"10k","bio":"...","email":"...","phone":"...","industry":"...","city":"..."}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro model handles structured extraction much better than Flash
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 } // Reserve some budget for verification logic
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const leadsRaw: CreatorLead[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Social Profile",
        uri: chunk.web.uri
      }));

    const parseFollowers = (f: string): number => {
      if (!f) return 0;
      const clean = f.toLowerCase().replace(/,/g, '').replace(/ followers/g, '').replace(/ seguaci/g, '').trim();
      if (clean.includes('k')) return parseFloat(clean.replace('k', '')) * 1000;
      if (clean.includes('m')) return parseFloat(clean.replace('m', '')) * 1000000;
      return parseInt(clean) || 0;
    };

    const filteredLeads = leadsRaw
      .filter(lead => {
        const hasContact = ((lead.email && lead.email.includes('@')) || (lead.phone && lead.phone.length > 5));
        const followerValue = parseFollowers(lead.followers);
        const meetsCriteria = followerValue >= 300;
        const notDuplicate = !existingUsernames.includes(lead.username);
        
        return hasContact && meetsCriteria && notDuplicate;
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
    console.error("Critical Sync Error:", error);
    throw error;
  }
};
