
import React, { useState, useEffect } from 'react';
import { SearchQuery, CreatorLead } from './types';
import { downloadLeadsAsCSV } from './utils/csv';
import { searchCreators } from './services/gemini';
import LeadCard from './components/LeadCard';

const ROLES = ['UGC Creator', 'Content Creator', 'Influencer', 'Talent/VIP'];
const INDUSTRIES = [
  'Generale', 'Beauty', 'Sport', 'Gym/Fitness', 'Fashion', 'Food', 'Travel', 'Tech', 'Business'
];

const App: React.FC = () => {
  const [query, setQuery] = useState<SearchQuery>({
    role: ROLES[0],
    industry: INDUSTRIES[0],
    city: 'Napoli',
    platform: 'instagram.com'
  });
  const [leads, setLeads] = useState<CreatorLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controllo immediato all'avvio
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.warn("ATTENZIONE: API_KEY non configurata correttamente.");
    }
  }, []);

  const handleSearch = async () => {
    // Se la chiave è vuota o stringa "undefined", blocca e avvisa
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      setError("Configurazione mancante: vai su Vercel > Settings > Environment Variables e aggiungi API_KEY.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await searchCreators(query);
      if (results.length === 0) {
        setError("Nessun creator trovato. Prova a cambiare città o categoria.");
      } else {
        setLeads(prev => [...results, ...prev]);
      }
    } catch (err: any) {
      setError(`Errore AI: ${err.message || "Impossibile completare la ricerca."}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Creator AI Hub</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">AI-Powered Lead Generation</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {leads.length > 0 && (
              <button
                onClick={() => downloadLeadsAsCSV(leads)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                Esporta CSV ({leads.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 sticky top-28">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Parametri Ricerca</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Città</label>
                <input
                  type="text"
                  value={query.city}
                  onChange={(e) => setQuery({ ...query, city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Es: Napoli, Milano..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tipologia</label>
                <select
                  value={query.role}
                  onChange={(e) => setQuery({ ...query, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Nicchia</label>
                <select
                  value={query.industry}
                  onChange={(e) => setQuery({ ...query, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
                  isLoading ? 'bg-slate-300 cursor-not-allowed animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isLoading ? 'Analisi Google...' : 'Cerca con IA'}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl border border-red-100 leading-relaxed">
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ATTENZIONE
                </div>
                {error}
              </div>
            )}
          </div>
        </aside>

        <main className="lg:col-span-3">
          {leads.length === 0 && !isLoading ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pronto per lo Scraping</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium max-w-xs">Inserisci i parametri e lascia che l'IA scansioni il web per trovare i lead migliori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
              {isLoading && (
                <div className="col-span-full py-20 flex flex-col items-center">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">L'IA sta interrogando Google Search...</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;