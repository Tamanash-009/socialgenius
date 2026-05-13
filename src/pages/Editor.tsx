import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Editor({ onBack }: { onBack: () => void }) {
  const { selectedIdea, drafts, updateDraft, profile, addHistory } = useAppStore();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedIdea) {
      setContent(drafts[selectedIdea.id] || selectedIdea.hook + '\n\n' + selectedIdea.framework.map(f => `- ${f}`).join('\n'));
    } else {
      setContent('');
    }
  }, [selectedIdea, drafts]);

  const handleSave = () => {
    if (selectedIdea) {
      updateDraft(selectedIdea.id, content);
      addHistory({ ...selectedIdea, content, timestamp: Date.now() });
      onBack();
    }
  };

  if (!selectedIdea || !profile) return null;

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>
        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest text-accent">
          {selectedIdea.platform}
        </span>
      </div>

      <div className="flex-1 glass-card p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 accent-gradient opacity-50" />
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{selectedIdea.title}</h3>
            <p className="text-sm text-white/40">Optimize this draft using your learned tone: <span className="text-teal-400 font-mono">{profile.toneKeywords[0]}</span></p>
          </div>
          <button className="p-2 rounded-xl bg-indigo-500/10 text-accent hover:bg-indigo-500/20 transition-colors">
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed placeholder-white/20 custom-scrollbar font-sans text-white/90"
          placeholder="Start writing your masterpiece..."
        />

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="text-xs text-white/30 font-mono">
            {content.length} chars • {content.split(' ').length} words
          </div>
          <button 
            onClick={handleSave}
            className="glass-button !py-2.5 !px-6 flex items-center gap-2 bg-white/10 hover:bg-white/20"
          >
            <Send className="w-4 h-4" /> Save & Schedule
          </button>
        </div>
      </div>
    </motion.div>
  );
}
