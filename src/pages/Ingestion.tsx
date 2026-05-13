import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, ArrowRight, Linkedin, Twitter, Globe, WifiOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { analyzeProfile } from '../services/geminiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import toast from 'react-hot-toast';

export default function Ingestion({ onNext }: { onNext: () => void }) {
  const isOnline = useOnlineStatus();
  const { setProfile, setIdeas, profileUrl, setProfileUrl } = useAppStore();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  const loadingSteps = [
    "Fetching digital footprint...",
    "Analyzing top-performing posts...",
    "Extracting unique tone of voice...",
    "Generating engagement-optimized hooks...",
    "Finalizing your creator profile..."
  ];

  const handleStartAnalysis = async () => {
    if (!isOnline) {
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 3000);
      return;
    }
    if (!profileUrl) return;
    setIsAnalyzing(true);
    
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const data = await analyzeProfile(profileUrl);
      setProfile(data.profileAnalysis);
      setIdeas(data.ideas);
      clearInterval(interval);
      toast.success('Profile analyzed successfully!');
      onNext();
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      toast.error(err.message || 'Failed to analyze profile.');
    }
  };

  if (isAnalyzing) {
    return (
      <motion.div
        key="analysis"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="relative mb-12">
          {/* Layered Pulsing Rings */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-accent rounded-full blur-[80px]" 
          />
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className="relative w-40 h-40 rounded-full p-[2px] bg-gradient-to-tr from-accent via-transparent to-brand-teal"
          >
            <div className="w-full h-full rounded-full bg-[#0A0118] flex items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ 
                  y: [-20, 20, -20],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap className="w-16 h-16 text-accent shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
              </motion.div>
              
              {/* Floating Orbs inside */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      x: [Math.random() * 100, Math.random() * 100],
                      y: [Math.random() * 100, Math.random() * 100],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.h3 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-display font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50"
        >
          Synthesizing Your Voice
        </motion.h3>

        <div className="w-full max-w-sm space-y-4">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-teal-400"
            />
          </div>
          
          <div className="relative h-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-accent font-mono text-xs uppercase tracking-[0.2em] font-bold"
              >
                {loadingSteps[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          {loadingSteps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === loadingStep ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="ingestion"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center"
    >
      <AnimatePresence>
        {(!isOnline || showOfflineToast) && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 glass-card bg-red-500/20 border-red-500/50 flex items-center gap-3 backdrop-blur-3xl"
          >
            <WifiOff className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium">Offline Mode: Using cached data</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12 relative"
      >
        <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse" />
        <div className="relative w-32 h-32 mx-auto rounded-[40px] bg-gradient-to-br from-indigo-500 to-teal-400 p-[1px] shadow-2xl">
          <div className="w-full h-full rounded-[39px] bg-[#0A0118] flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Zap className="w-16 h-16 text-white" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-accent font-medium text-sm">
        <Sparkles className="w-4 h-4" />
        Now Powered by Gemini 3 Flash
      </div>
      
      <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-8 leading-[1.1] tracking-tight max-w-4xl">
        The <span className="text-indigo-400">AI Twin</span> for your <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Digital Presence.</span>
      </h2>
      
      <p className="text-white/50 text-base md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
        We study your voice so you can spend more time thinking, and less time typing. Connect your profile to witness the magic.
      </p>

      <div className="w-full max-w-2xl relative group bg-white/5 p-1 rounded-2xl md:rounded-[32px] backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:border-indigo-500/30">
        <input
          type="text"
          placeholder="Paste LinkedIn or X profile URL..."
          className="w-full bg-transparent border-none outline-none px-6 md:px-8 py-5 md:py-6 text-base md:text-lg text-white placeholder-white/20 pr-32 md:pr-40"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
        />
        <button 
          onClick={handleStartAnalysis}
          disabled={(!isOnline && profileUrl.length > 0) || !profileUrl.includes('.') || profileUrl.length < 5}
          className="absolute right-2 top-2 bottom-2 glass-button !px-4 md:!px-8 !py-0 !rounded-xl md:!rounded-[24px] group-focus-within:scale-105 transition-transform text-sm disabled:opacity-50"
        >
          <span className="hidden sm:inline">Analyze</span>
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {!isOnline && (
        <p className="mt-4 text-red-400/80 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Internet required for first-time analysis
        </p>
      )}

      <div className="mt-16 flex flex-wrap items-center justify-center gap-12 grayscale opacity-40">
        <div className="flex items-center gap-3">
          <Linkedin className="w-6 h-6" />
          <span className="font-bold tracking-widest text-xs uppercase">LinkedIn</span>
        </div>
        <div className="flex items-center gap-3">
          <Twitter className="w-6 h-6" />
          <span className="font-bold tracking-widest text-xs uppercase">X / Twitter</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6" />
          <span className="font-bold tracking-widest text-xs uppercase">Substack</span>
        </div>
      </div>
    </motion.div>
  );
}
