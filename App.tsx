
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Scraper Pro</h1>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">AI Lead Generator</p>
            </div>
          </div>

          {leads.length > 0 && (
            <button
              onClick={() => downloadLeadsAsCSV(leads)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200"
            >
              Export CSV ({leads.length})
            </button>
          )}
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        <aside className="w-full lg:w-80 p-8 lg:border-r border-slate-200 bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] overflow-y-auto">
          <form className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Piattaforma</label>
              <select
                value={query.platform}
                onChange={(e) => setQuery({ ...query, platform: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
              >
                <option value="instagram.com">Instagram</option>
                <option value="tiktok.com">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Ruolo Target</label>
              <select
                value={query.role}
                onChange={(e) => setQuery({ ...query, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Settore</label>
              <select
                value={query.industry}
                onChange={(e) => setQuery({ ...query, industry: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Follower Minimi</label>
              <select
                value={query.minFollowers}
                onChange={(e) => setQuery({ ...query, minFollowers: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
              >
                {FOLLOWER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Città</label>
              <input
                type="text"
                value={query.city}
                onChange={(e) => setQuery({ ...query, city: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                placeholder="Es: Napoli..."
              />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => handleSearch(e, true)}
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:bg-slate-300"
              >
                {isLoading ? 'Analisi in corso...' : 'Nuova Ricerca'}
              </button>
              
              {leads.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={(e) => handleSearch(e, false)}
                  className="w-full py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Carica Altri 6
                </button>
              )}
            </div>
          </form>
        </aside>

        <main className="flex-grow p-8 lg:p-12">
          {error && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl mb-10">
              <p className="text-amber-800 font-bold text-sm">{error}</p>
            </div>
          )}

          {!isLoading && leads.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-100 text-slate-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-400">Database Pronto</h2>
              <p className="text-sm text-slate-300 mt-2 font-medium">Imposta i filtri e clicca "Nuova Ricerca" per iniziare.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
            
            {isLoading && [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-8 animate-pulse space-y-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-100 rounded w-40"></div>
                    <div className="h-4 bg-slate-100 rounded w-24"></div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-16"></div>
                </div>
                <div className="h-20 bg-slate-50 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                  <div className="h-12 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>

          {sources.length > 0 && (
            <div className="mt-20 border-t border-slate-100 pt-8">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Fonti Verificate (Grounding)</h3>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md hover:text-indigo-600">
                    {new URL(s.uri).hostname}
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
