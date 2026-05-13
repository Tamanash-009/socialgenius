import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Send, Loader2, Linkedin, Twitter, MessageSquare, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generatePost, GeneratedPostResponse } from '../services/geminiService';
import { toast } from 'react-hot-toast';

type PlatformKey = 'linkedin' | 'twitter' | 'reddit' | 'substack';

const PLATFORMS: { id: PlatformKey; label: string; icon: any }[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter },
  { id: 'reddit', label: 'Reddit', icon: MessageSquare },
  { id: 'substack', label: 'Substack', icon: FileText },
];

export default function Editor({ onBack }: { onBack: () => void }) {
  const { selectedIdea, drafts, updateDraft, profile, addHistory } = useAppStore();
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('linkedin');
  const [postData, setPostData] = useState<GeneratedPostResponse | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize from drafts or hook
  useEffect(() => {
    if (selectedIdea) {
      try {
        const savedDraft = drafts[selectedIdea.id];
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setPostData(parsed);
          setCurrentContent(parsed.platformVariants['linkedin']?.content || '');
        } else {
          setCurrentContent(selectedIdea.hook);
        }
      } catch (e) {
        setCurrentContent(drafts[selectedIdea.id] || selectedIdea.hook);
      }
    }
  }, [selectedIdea, drafts]);

  // Update current content when platform changes (if generated)
  useEffect(() => {
    if (postData) {
      setCurrentContent(postData.platformVariants[activePlatform]?.content || '');
    }
  }, [activePlatform, postData]);

  const handleContentChange = (val: string) => {
    setCurrentContent(val);
    if (postData) {
      setPostData({
        ...postData,
        platformVariants: {
          ...postData.platformVariants,
          [activePlatform]: {
            ...postData.platformVariants[activePlatform],
            content: val
          }
        }
      });
    }
  };

  const handleSave = () => {
    if (selectedIdea) {
      const dataToSave = postData ? JSON.stringify(postData) : currentContent;
      updateDraft(selectedIdea.id, dataToSave);
      addHistory({ ...selectedIdea, content: currentContent, timestamp: Date.now() });
      onBack();
    }
  };

  const handleGenerate = async () => {
    if (!selectedIdea || !profile) return;
    
    setIsGenerating(true);
    const toastId = toast.loading('Generating all platform variants...', {
      style: {
        background: '#1F1235',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      }
    });
    
    try {
      // Use existing content as context, or fallback to the hook
      const contextText = currentContent.trim().length > 0 ? currentContent : selectedIdea.hook;
      const generated = await generatePost(contextText, profile);
      
      setPostData(generated);
      setCurrentContent(generated.platformVariants[activePlatform]?.content || '');
      toast.success('Variants generated successfully!', { id: toastId });
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
      </div>

      {/* Platform Switcher */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit backdrop-blur-xl">
        {PLATFORMS.map((plat) => {
          const Icon = plat.icon;
          return (
            <button
              key={plat.id}
              onClick={() => setActivePlatform(plat.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors z-10 ${
                activePlatform === plat.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {activePlatform === plat.id && (
                <motion.div
                  layoutId="activePlatform"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 z-10" />
              <span className="z-10">{plat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 glass-card p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 accent-gradient opacity-50" />
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{selectedIdea.title}</h3>
            <p className="text-sm text-white/40">Optimize this draft using your learned tone: <span className="text-teal-400 font-mono capitalize">{profile.tone}</span></p>
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

        {postData && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activePlatform}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-sm"
            >
              <div className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1">AI Recommendation</div>
              <p className="text-accent">{postData.platformVariants[activePlatform]?.formatting}</p>
            </motion.div>
          </AnimatePresence>
        )}

        <textarea
          value={currentContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed placeholder-white/20 custom-scrollbar font-sans text-white/90"
          placeholder="Start writing your masterpiece..."
        />

        {postData && postData.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {postData.hashtags.map((tag, i) => (
              <span key={i} className="text-xs font-mono text-teal-400 bg-teal-400/10 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
          <div className="text-xs text-white/30 font-mono">
            {currentContent.length} chars • {currentContent.split(' ').filter(Boolean).length} words
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
