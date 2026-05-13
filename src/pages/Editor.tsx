import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generatePost } from '../services/geminiService';
import { toast } from 'react-hot-toast';

export default function Editor({ onBack }: { onBack: () => void }) {
  const { selectedIdea, drafts, updateDraft, profile, addHistory } = useAppStore();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (selectedIdea) {
      setContent(drafts[selectedIdea.id] || selectedIdea.hook + '\n\n' + (selectedIdea.content || ''));
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

  const handleGenerate = async () => {
    if (!selectedIdea || !profile) return;
    
    setIsGenerating(true);
    const toastId = toast.loading('Generating your masterpiece...', {
      style: {
        background: '#1F1235',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      }
    });
    
    try {
      // Use existing content as context, or fallback to the hook
      const contextText = content.trim().length > 0 ? content : selectedIdea.hook;
      const generated = await generatePost(contextText, profile.tone, selectedIdea.platform);
      
      const newContent = `${generated.post}\n\n---\n\n📝 Caption: ${generated.caption}\n\n#️⃣ Hashtags: ${generated.hashtags.join(' ')}\n\n💡 Platform Suggestions:\n• Instagram: ${generated.platformSuggestions.instagram}\n• LinkedIn: ${generated.platformSuggestions.linkedin}\n• X: ${generated.platformSuggestions.twitter}`;
      
      setContent(newContent);
      toast.success('Post generated successfully!', { id: toastId });
    } catch (error) {
      console.error("[Editor] Generation error:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate post. Check logs.', { id: toastId });
    } finally {
      setIsGenerating(false);
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
            <p className="text-sm text-white/40">Optimize this draft using your learned tone: <span className="text-teal-400 font-mono">{profile.tone}</span></p>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="p-2 rounded-xl bg-indigo-500/10 text-accent hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Generate Post with AI"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
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
