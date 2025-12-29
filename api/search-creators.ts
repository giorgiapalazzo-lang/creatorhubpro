
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, existingUsernames } = req.body;
  
  // Utilizzo diretto come da linee guida
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
    AGENTE DI ESTRAZIONE LEAD AI.
    Query di ricerca: "${finalSearchQuery}"
    
    COMPITO:
    Identifica 6 profili reali di creator su ${query.platform} a ${query.city}.
    Per ogni profilo, estrai:
    - Username esatto e URL profilo.
    - Conteggio follower (es. 12.5k, 2k).
    - Bio del profilo (riassunto).
    - Email o numero di cellulare/WhatsApp se presenti pubblicamente.
    - Categoria: ${query.role}.

    RESTITUISCI SOLO UN ARRAY JSON VALIDO:
    [
      {
        "name": "Nome Visualizzato",
        "username": "handle",
        "profileUrl": "URL",
        "followers": "Numero",
        "bio": "Estratto bio",
        "email": "email o vuoto",
        "phone": "telefono o vuoto",
        "category": "${query.role}",
        "city": "${query.city}",
        "industry": "${query.industry}"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
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
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    }));

    return res.status(200).json({ leads: leadsWithIds, sources });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Se l'errore è dovuto alla chiave mancante o invalida
    if (error.message?.includes("API key")) {
      return res.status(500).json({ 
        error: "Configurazione API errata. Assicurati di aver impostato API_KEY nelle variabili d'ambiente di Vercel." 
      });
    }
    return res.status(500).json({ error: error.message || 'Errore durante la ricerca dei lead.' });
  }
}
