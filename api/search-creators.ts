
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { query, existingUsernames } = req.body;
  const apiKey = process.env.API_KEY;

  // Controllo critico per evitare il fallback sui "default credentials" di Google Cloud
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    return res.status(401).json({ 
      error: "Variabile d'ambiente API_KEY mancante. Configurala nelle impostazioni di Vercel (Environment Variables)." 
    });
  }

  // Inizializzazione sicura con chiave verificata
  const ai = new GoogleGenAI({ apiKey });

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
    Cerca su Google: "${finalSearchQuery}"
    
    ESTRAI 6 PROFILI REALI per la categoria "${query.role}" a ${query.city}.
    
    Per ogni profilo restituisci questo JSON esatto:
    {
      "name": "Nome",
      "username": "handle",
      "profileUrl": "URL",
      "followers": "Numero",
      "bio": "Riassunto bio",
      "email": "email se trovata",
      "phone": "numero se trovato",
      "category": "${query.role}",
      "city": "${query.city}",
      "industry": "${query.industry}"
    }

    RESTITUISCI SOLO UN ARRAY JSON VALIDO [{}, {}...].
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

    const text = response.text;
    if (!text) throw new Error("Risposta vuota dal modello.");

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

    return res.status(200).json({ leads: leadsWithIds, sources });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ 
      error: error.message || "Errore durante l'elaborazione dei dati." 
    });
  }
}
