
import React, { useState } from 'react';
import { SearchQuery, CreatorLead } from './types.ts';
import { searchCreators } from './services/gemini.ts';
import { downloadLeadsAsCSV } from './utils/csv.ts';
import LeadCard from './components/LeadCard.tsx';

const ROLES = ['UGC Creator', 'Content Creator', 'Influencer', 'Talent/VIP'];
const INDUSTRIES = [
  'Generale', 'Beauty', 'Sport', 'Gym/Fitness', 'Fashion', 'Food', 'Travel', 'Tech', 'Business'
];
const FOLLOWER_OPTIONS = [
  { label: 'Qualsiasi (Min 300)', value: '300' },
  { label: 'Micro (1k+)', value: '1k' },
  { label: 'Crescita (5k+)', value: '5k' },
  { label: 'Solid (10k+)', value: '10k' },
  { label: 'Macro (50k+)', value: '50k' }
];

const App: React.FC = () => {
  const [query, setQuery] = useState<SearchQuery>({
    role: 'UGC Creator',
    industry: 'Generale',
    city: 'Napoli',
    platform: 'instagram.com',
    minFollowers: '300'
  });
  const [leads, setLeads] = useState<CreatorLead[]>([]);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent, reset = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (reset) {
      setLeads([]);
      setSources([]);
    }

    try {
      const existingUsernames = reset ? [] : leads.map(l => l.username);
      const result = await searchCreators(query, existingUsernames);
      
      if (result.leads.length === 0) {
        setError("Nessun nuovo profilo trovato. Prova ad espandere i parametri di ricerca.");
      } else {
        setLeads(prev => [...prev, ...result.leads]);
        setSources(prev => {
          const combined = [...prev, ...result.sources];
          return Array.from(new Map(combined.map(item => [item.uri, item])).values());
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 rotate-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">LeadEngine AI</h1>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Creator Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {leads.length > 0 && (
              <button
                onClick={() => downloadLeadsAsCSV(leads)}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-200 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export ({leads.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        <aside className="w-full lg:w-80 p-8 lg:border-r border-slate-200 bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] overflow-y-auto">
          <form className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Network Target</label>
              <div className="grid grid-cols-2 gap-2">
                {['instagram.com', 'tiktok.com'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery({...query, platform: p})}
                    className={`py-3 px-2 text-[10px] font-black rounded-xl border-2 transition-all uppercase tracking-tighter ${
                      query.platform === p 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {p.split('.')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Profilo Ricercato</label>
              <select
                value={query.role}
                onChange={(e) => setQuery({ ...query, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none cursor-pointer"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nicchia</label>
              <select
                value={query.industry}
                onChange={(e) => setQuery({ ...query, industry: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none cursor-pointer"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Fascia Followers</label>
              <select
                value={query.minFollowers}
                onChange={(e) => setQuery({ ...query, minFollowers: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none cursor-pointer"
              >
                {FOLLOWER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Area Geografica</label>
              <input
                type="text"
                value={query.city}
                onChange={(e) => setQuery({ ...query, city: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                placeholder="Es: Napoli, Milano..."
              />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => handleSearch(e, true)}
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isLoading ? 'Sincronizzazione...' : 'Avvia Scansione'}
              </button>
            </div>
          </form>
        </aside>

        <main className="flex-grow p-8 lg:p-12 bg-[#F8FAFC]">
          {error && (
            <div className="bg-white border-l-4 border-rose-500 p-6 rounded-2xl shadow-xl mb-10 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start space-x-4">
                <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-900 font-black text-sm uppercase tracking-tight">Errore di Configurazione</p>
                  <p className="text-slate-500 text-sm mt-1">{error}</p>
                  {error.includes("API_KEY") && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-black text-slate-800 mb-2">GUIDA AL DEPLOY SU VERCEL:</p>
                      <ul className="text-[11px] text-slate-600 space-y-2 list-disc ml-4">
                        <li>Apri la Dashboard di <b>Vercel</b></li>
                        <li>Seleziona questo progetto &gt; <b>Settings</b> &gt; <b>Environment Variables</b></li>
                        <li>Aggiungi una nuova variabile: <b>Key:</b> <code className="bg-white px-1">API_KEY</code> | <b>Value:</b> <code className="bg-white px-1">[Tua Chiave]</code></li>
                        <li><b>Salva</b> e vai nella tab <b>Deployments</b> per fare "Redeploy" dell'ultimo commit</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoading && leads.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-slate-100 text-slate-200 mb-8">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pronto per l'estrazione</h2>
              <p className="text-slate-400 mt-2 font-medium max-w-sm">Configura i parametri a sinistra e avvia la scansione web via AI.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
            {leads.map((lead, idx) => (
              <div key={lead.id} className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}>
                <LeadCard lead={lead} />
              </div>
            ))}
            
            {isLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 animate-pulse shadow-sm">
                <div className="h-6 bg-slate-100 rounded-full w-40 mb-4"></div>
                <div className="h-24 bg-slate-50 rounded-3xl mb-6"></div>
                <div className="h-14 bg-slate-100 rounded-2xl mb-3"></div>
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
              </div>
            ))}
          </div>

          {sources.length > 0 && (
            <div className="mt-20 border-t border-slate-200 pt-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Fonti Verificate (AI Grounding)</h3>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:text-indigo-600 transition-all shadow-sm">
                    {s.title || new URL(s.uri).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
