import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MoreVertical, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Schedule() {
  const { history } = useAppStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <motion.div
      key="schedule"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold font-display">Content Calendar</h2>
        
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'upcoming' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'past' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            Past Drops
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/20">
            <CalendarIcon className="w-8 h-8 text-white/20 mb-4" />
            <p className="text-white/40 font-medium">No posts scheduled yet.</p>
            <p className="text-white/20 text-sm mt-1">Start writing in the Feed to schedule posts.</p>
          </div>
        ) : (
          history.map((post, i) => (
            <div key={i} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${post.platform === 'LinkedIn' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'}`}>
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{post.platform}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-white/90 leading-snug">{post.title}</h4>
                </div>
              </div>
              
              <button className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-colors self-end sm:self-auto">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
