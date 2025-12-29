import React, { useState } from 'react';
import { SearchQuery, CreatorLead } from './types.ts';
import { searchCreators } from './services/gemini.ts';
import { downloadLeadsAsCSV } from './utils/csv.ts';
import LeadCard from './components/LeadCard.tsx';

const ROLES = ['UGC Creator', 'Content Creator', 'Influencer', 'Talent/VIP'];
const INDUSTRIES = [
  'Generale', 'Artista', 'Musica', 'Beauty', 'Sport', 'Medicina', 
  'Gym/Fitness', 'Fashion', 'Food', 'Travel', 'Tech', 'Business'
];
const FOLLOWER_OPTIONS = [
  { label: 'Min 300 (Standard)', value: '300' },
  { label: '1k+', value: '1k' },
  { label: '5k+', value: '5k' },
  { label: '10k+', value: '10k' },
  { label: '50k+', value: '50k' },
  { label: '100k+', value: '100k' }
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
        setError("Nessun profilo rilevato con i filtri di qualità attuali. Prova a cambiare città o a rimuovere il limite follower.");
      } else {
        setLeads(prev => [...prev, ...result.leads]);
        setSources(prev => {
          const combined = [...prev, ...result.sources];
          const unique = Array.from(new Map(combined.map(item => [item.uri, item])).values());
          return unique;
        });
      }
    } catch (err: any) {
      setError("Errore durante la sincronizzazione con il database remoto: " + (err.message || 'Riprova.'));
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setLeads([]);
    setSources([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Creator Hub Pro</h1>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-[0.2em] mt-1">SaaS Talent Intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {leads.length > 0 && (
              <>
                <button
                  onClick={clearResults}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => downloadLeadsAsCSV(leads)}
                  className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all text-sm font-black shadow-2xl shadow-slate-300"
                >
                  Download Database ({leads.length})
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        <aside className="w-full lg:w-96 p-8 lg:border-r border-slate-200 bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] overflow-y-auto">
          <div className="space-y-8">
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Analisi Parametrica</h3>
              <form className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Social Network</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['instagram.com', 'tiktok.com'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQuery({...query, platform: p})}
                        className={`py-3 px-4 text-xs font-black rounded-xl border-2 transition-all ${
                          query.platform === p 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {p.split('.')[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Profilo Target</label>
                  <select
                    value={query.role}
                    onChange={(e) => setQuery({ ...query, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                  >
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Settore</label>
                  <select
                    value={query.industry}
                    onChange={(e) => setQuery({ ...query, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                  >
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Soglia Followers</label>
                  <select
                    value={query.minFollowers}
                    onChange={(e) => setQuery({ ...query, minFollowers: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                  >
                    {FOLLOWER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Località (Search in Bio)</label>
                  <input
                    type="text"
                    value={query.city}
                    onChange={(e) => setQuery({ ...query, city: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold outline-none"
                    placeholder="Es. Napoli, Milano..."
                  />
                </div>

                <div className="pt-6 flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={(e) => handleSearch(e, true)}
                    disabled={isLoading}
                    className={`w-full py-5 rounded-2xl text-white font-black text-sm shadow-2xl transition-all active:scale-95 ${
                      isLoading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-black shadow-slate-200'
                    }`}
                  >
                    {isLoading ? 'Processing Intelligence...' : 'Sincronizza Database'}
                  </button>

                  {leads.length > 0 && !isLoading && (
                    <button
                      type="button"
                      onClick={(e) => handleSearch(e, false)}
                      className="w-full py-4 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-50 transition-all"
                    >
                      Analizza altri 6
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
               <div className="flex items-center space-x-2 mb-2">
                 <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                 </svg>
                 <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Quality Assurance v3.1</h4>
               </div>
               <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                 Analisi avanzata: +20 post, +300 followers (precisi), Reels attivi e check bio città.
               </p>
            </section>
          </div>
        </aside>

        <main className="flex-grow p-8 lg:p-12 bg-[#F8FAFC]">
          {error && (
            <div className="max-w-4xl mb-10 bg-white border-l-4 border-amber-400 text-slate-700 px-6 py-5 rounded-2xl flex items-start shadow-xl shadow-slate-200/50">
              <svg className="w-6 h-6 mr-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-base font-black">Notifica di Sistema</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && leads.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-48">
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-slate-200">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Database Offline</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Avvia la sincronizzazione per caricare i talenti dal database globale.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
            {leads.map((lead, index) => (
              <div 
                key={lead.id} 
                className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                style={{ animationDelay: `${(index % 6) * 100}ms` }}
              >
                <LeadCard lead={lead} />
              </div>
            ))}
            
            {isLoading && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="h-[28rem] bg-white border border-slate-100 rounded-[2.5rem] animate-pulse shadow-sm flex flex-col p-8 space-y-6">
                    <div className="flex justify-between">
                      <div className="space-y-3">
                        <div className="h-7 bg-slate-50 rounded-xl w-48"></div>
                        <div className="h-4 bg-slate-50 rounded-lg w-32"></div>
                      </div>
                      <div className="h-10 bg-slate-50 rounded-xl w-20"></div>
                    </div>
                    <div className="space-y-3 flex-grow">
                      <div className="h-4 bg-slate-50 rounded-lg w-full"></div>
                      <div className="h-4 bg-slate-50 rounded-lg w-full"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
                      <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
                    </div>
                    <div className="h-14 bg-slate-100 rounded-2xl w-full mt-auto"></div>
                  </div>
                ))}
              </>
            )}
          </div>

          {leads.length > 0 && !isLoading && (
            <div className="mt-24 border-t border-slate-200 pt-16 flex flex-col items-center">
              <button
                onClick={(e) => handleSearch(e, false)}
                className="group flex flex-col items-center space-y-6"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-2xl shadow-slate-200/50 active:scale-90">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-slate-900 transition-colors">Estendi Database</span>
              </button>
            </div>
          )}

          {sources.length > 0 && (
             <div className="mt-20 opacity-10 hover:opacity-100 transition-opacity">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Database Integrity Sources</p>
               <div className="flex flex-wrap gap-2">
                 {sources.slice(0, 5).map((s, i) => (
                   <span key={i} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded truncate max-w-[150px]">
                     {new URL(s.uri).hostname}
                   </span>
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