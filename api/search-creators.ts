
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, existingUsernames } = req.body;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Configurazione mancante: API_KEY non trovata sul server.' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Costruzione della query di ricerca avanzata
  const followerConstraint = query.minFollowers !== '300' ? `"${query.minFollowers} followers"` : '"followers"';
  const baseSearch = `${query.role} ${query.industry} ${query.city} ${followerConstraint} site:${query.platform}`;
  const qualitySignals = `"reels" "posts" "${query.city}"`;
  const contactMarkers = `("email" OR "mail" OR "whatsapp" OR "cell" OR "+39")`;
  
  const excludeUsernames = existingUsernames && existingUsernames.length > 0 
    ? existingUsernames.slice(0, 15).map((u: string) => `-inurl:${u}`).join(" ")
    : "";

  const finalSearchQuery = `${baseSearch} ${qualitySignals} ${contactMarkers} ${excludeUsernames}`;

  const prompt = `
    DASHBOARD INTELLIGENCE - ESTRAZIONE LEAD.
    Analizza i risultati web per: "${finalSearchQuery}"
    
    REQUISITI RIGIDI:
    1. Trova 6 creator reali basati a ${query.city}.
    2. Estrai il numero esatto di followers (es: 15.2k, 5k).
    3. Trova contatti pubblici (email, cellulare o whatsapp).
    4. Verifica che siano attivi nel settore "${query.industry}".

    RESTITUISCI SOLO UN ARRAY JSON VALIDO:
    [
      {
        "name": "Nome",
        "username": "handle",
        "profileUrl": "URL",
        "followers": "Numero",
        "bio": "Breve bio",
        "email": "email o stringa vuota",
        "phone": "numero o stringa vuota",
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
      },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const leadsRaw = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Social Source",
        uri: chunk.web.uri
      }));

    const leadsWithIds = leadsRaw.map((lead: any, index: number) => ({
      ...lead,
      id: `${Date.now()}-${index}`
    }));

    return res.status(200).json({ leads: leadsWithIds, sources });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Errore durante l\'analisi dei dati.' });
  }
}
