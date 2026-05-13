import { motion } from 'framer-motion';
import { History, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PostIdea } from '../services/geminiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function Dashboard({ onSelectIdea, onNewDraft }: { onSelectIdea: (idea: PostIdea) => void, onNewDraft: () => void }) {
  const { profile, ideas } = useAppStore();
  const isOnline = useOnlineStatus();

  if (!profile) return null;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-12 gap-8"
    >
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Creator DNA</h2>
            <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">SYNCED</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/50">Hook Strength</p>
                <p className="text-2xl font-bold">{profile.hookStrength}%</p>
              </div>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.hookStrength}%` }}
                  className="h-full accent-gradient"
                />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/50">Engagement Rank</p>
                <p className="text-2xl font-bold">{profile.engagementRate > 4 ? 'Elite' : 'Rising'}</p>
              </div>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(profile.engagementRate / 10) * 100}%` }}
                  className="h-full teal-gradient"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
           <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
             <History className="w-4 h-4" />
             Recent Brainstorms
           </h2>
           <div className="space-y-2">
             {ideas.slice(0, 3).map(i => (
               <div key={i.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-[10px] flex justify-between items-center">
                 <span className="truncate max-w-[120px]">{i.title}</span>
                 <span className="text-accent">{i.engagement}</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-white/40 flex items-center gap-2">
            Daily Drop Ideas
          </h4>
          <button 
            onClick={onNewDraft} 
            disabled={!isOnline}
            className="text-xs font-bold text-accent px-3 py-1 bg-accent/10 rounded-lg hover:bg-accent/20 disabled:opacity-30 flex items-center gap-2"
          >
            {!isOnline && <WifiOff className="w-3 h-3" />}
            {isOnline ? 'RE-SYNC' : 'CACHED'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ideas.map((idea, idx) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectIdea(idea)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group ${idx === 1 ? 'bg-indigo-500/10 border-accent/30' : 'glass-card hover:bg-white/10'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold ${idea.platform === 'LinkedIn' ? 'text-blue-400' : idea.platform === 'X' ? 'text-white' : 'text-orange-400'}`}>
                  {idea.platform.toUpperCase()}
                </span>
                <span className="text-[10px] text-white/30">{idea.engagement} Potency</span>
              </div>
              <p className={`text-sm font-medium leading-snug group-hover:text-accent transition-colors ${idx === 1 ? 'text-white' : 'text-white/80'}`}>
                {idea.hook.length > 80 ? idea.hook.substring(0, 80) + '...' : idea.hook}
              </p>
            </motion.div>
          ))}
          
          <button onClick={onNewDraft} className="p-6 rounded-2xl border border-dashed border-white/20 bg-white/3 flex flex-col items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-all">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Custom Draft</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
