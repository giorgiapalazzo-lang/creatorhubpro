
import React from 'react';
import { CreatorLead } from '../types';

interface LeadCardProps {
  lead: CreatorLead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  return (
    <div className="group bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-grow pr-4">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-black text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">
              {lead.name || lead.username}
            </h3>
          </div>
          <p className="text-sm text-indigo-500 font-black tracking-wider uppercase">@{lead.username}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="bg-slate-900 text-white text-[11px] font-black px-4 py-1.5 rounded-xl uppercase tracking-tighter shadow-lg shadow-slate-200">
            {lead.followers || 'VERIFYING'}
          </div>
          <div className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase border border-indigo-100">
            {lead.industry}
          </div>
        </div>
      </div>
      
      <div className="mb-8 flex-grow">
        <div className="bg-slate-50/50 p-4 rounded-2xl">
          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3 font-medium italic">
            "{lead.bio || 'Dettagli profilo in fase di sincronizzazione.'}"
          </p>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className={`flex items-center p-4 rounded-[1.25rem] border-2 transition-all ${lead.email ? 'bg-white border-slate-100 group-hover:border-indigo-100' : 'bg-slate-50 border-slate-50'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${lead.email ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-300'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className={`text-[13px] font-black truncate tracking-tight ${lead.email ? 'text-slate-900' : 'text-slate-300 italic'}`}>
            {lead.email || 'Email non disponibile'}
          </span>
        </div>
        
        <div className={`flex items-center p-4 rounded-[1.25rem] border-2 transition-all ${lead.phone ? 'bg-white border-slate-100 group-hover:border-emerald-100' : 'bg-slate-50 border-slate-50'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${lead.phone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span className={`text-[13px] font-black truncate tracking-tight ${lead.phone ? 'text-slate-900' : 'text-slate-300 italic'}`}>
            {lead.phone || 'Cellulare non disponibile'}
          </span>
        </div>
      </div>
      
      <div className="flex space-x-3 mt-auto pt-4">
        <a 
          href={lead.profileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-grow text-center py-4 bg-slate-900 hover:bg-black text-white text-[11px] font-black rounded-2xl transition-all shadow-xl shadow-slate-200 uppercase tracking-[0.2em]"
        >
          Profilo Completo
        </a>
        <button
          onClick={() => {
            if (lead.email) {
              window.location.href = `mailto:${lead.email}`;
            } else if (lead.phone) {
              window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
            }
          }}
          className={`w-16 flex items-center justify-center rounded-2xl border-2 transition-all ${
            (lead.email || lead.phone) ? 'border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-200 cursor-not-allowed'
          }`}
          disabled={!lead.email && !lead.phone}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
