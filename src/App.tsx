import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Linkedin, 
  Twitter, 
  Send, 
  BarChart3, 
  Plus, 
  ArrowRight, 
  Check, 
  Copy, 
  RefreshCcw,
  Sparkles,
  MessageSquare,
  Globe,
  Settings,
  History,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  ShieldCheck,
  WifiOff,
  Wifi,
  MousePointer2,
  LayoutGrid
} from 'lucide-react';
import { analyzeProfile, CreatorProfile, PostIdea, generateAlternativeHooks } from './services/geminiService.ts';
import { useAppStore } from './store/useAppStore';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

type AppState = 'INGESTION' | 'ANALYSIS' | 'DASHBOARD' | 'EDITOR' | 'ANALYTICS' | 'ACCOUNTS' | 'SCHEDULE';

export default function App() {
  const isOnline = useOnlineStatus();
  const { 
    profile, setProfile, 
    ideas, setIdeas, 
    scheduledPosts, setScheduledPosts,
    updateDraft, drafts,
    hideScrollbars, setHideScrollbars
  } = useAppStore();

  const [state, setState] = useState<AppState>(profile ? 'DASHBOARD' : 'INGESTION');
  const [profileUrl, setProfileUrl] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [accounts, setAccounts] = useState({ linkedin: false, x: false });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  const loadingSteps = [
    "Fetching digital footprint...",
    "Analyzing top-performing posts...",
    "Extracting unique tone of voice...",
    "Generating engagement-optimized hooks...",
    "Finalizing your creator profile..."
  ];

  useEffect(() => {
    fetchAnalytics();
    fetchAccounts();
    fetchScheduled();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchAccounts();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (hideScrollbars) {
      document.documentElement.classList.add('hide-scrollbars');
    } else {
      document.documentElement.classList.remove('hide-scrollbars');
    }
  }, [hideScrollbars]);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 3000);
    }
  }, [isOnline]);

  const fetchAnalytics = async () => {
    if (!isOnline) return;
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (e) { console.error(e); }
  };

  const fetchAccounts = async () => {
    if (!isOnline) return;
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (e) { console.error(e); }
  };

  const fetchScheduled = async () => {
    if (!isOnline) return;
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      setScheduledPosts(data);
    } catch (e) { console.error(e); }
  };

  const handleChangePlatform = (newPlatform: string) => {
    if (!selectedIdea) return;
    // Map the UI label back to the platform type
    let p: PostIdea['platform'] = 'LinkedIn';
    if (newPlatform.includes('X')) p = 'X';
    if (newPlatform.includes('Reddit')) p = 'Reddit';
    if (newPlatform.includes('Substack')) p = 'Substack';
    
    setSelectedIdea({ ...selectedIdea, platform: p });
  };

  const handleStartAnalysis = async () => {
    if (!isOnline) {
      setShowOfflineToast(true);
      return;
    }
    if (!profileUrl) return;
    setState('ANALYSIS');
    
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const data = await analyzeProfile(profileUrl);
      setProfile(data.profile);
      setIdeas(data.ideas);
      clearInterval(interval);
      setState('DASHBOARD');
    } catch (err) {
      clearInterval(interval);
      setState('INGESTION');
    }
  };

  const [altHooks, setAltHooks] = useState<string[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedIdea && state === 'EDITOR') {
      loadHooks();
    }
  }, [selectedIdea, state]);

  const loadHooks = async () => {
    if (!isOnline || !selectedIdea) return;
    setLoadingHooks(true);
    try {
      const hooks = await generateAlternativeHooks(selectedIdea);
      setAltHooks(hooks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHooks(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaceHook = (newHook: string) => {
    if (!selectedIdea) return;
    const newIdea = { ...selectedIdea, hook: newHook };
    setSelectedIdea(newIdea);
  };

  const handleSelectIdea = (idea: PostIdea) => {
    setSelectedIdea(idea);
    setState('EDITOR');
  };

  const handleConnect = async (platform: string) => {
    if (!isOnline) {
      setShowOfflineToast(true);
      return;
    }
    try {
      const res = await fetch(`/api/auth/url/${platform}`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (e) { console.error(e); }
  };

  const handleSchedulePost = async () => {
    if (!isOnline) {
      setShowOfflineToast(true);
      return;
    }
    if (!selectedIdea || !scheduleData.date || !scheduleData.time) return;
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: selectedIdea,
          scheduleAt: `${scheduleData.date}T${scheduleData.time}`,
          platform: selectedIdea.platform
        })
      });
      if (res.ok) {
        fetchScheduled();
        setIsScheduling(false);
        setState('SCHEDULE');
      }
    } catch (e) { console.error(e); }
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleUpdateDraft = (id: string, content: string) => {
    updateDraft(id, content);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleEditScheduled = (post: any) => {
    setSelectedIdea(post.idea);
    setState('EDITOR');
    // Pre-fill editor with scheduled content if it differs from the idea
    if (post.idea.content !== post.content) {
      updateDraft(post.idea.id, post.content);
    }
    // Also store schedule data for possible re-scheduling
    const dateObj = new Date(post.scheduleAt);
    setScheduleData({
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().split(' ')[0].substring(0, 5)
    });
    setIsScheduling(true);
  };

  const [isPosting, setIsPosting] = useState(false);
  const handlePostNow = async () => {
    if (!isOnline || !selectedIdea) return;
    
    const platformKey = selectedIdea.platform.toLowerCase().includes('linkedin') ? 'linkedin' : 'x';
    if (!(accounts as any)[platformKey]) {
      setState('ACCOUNTS');
      return;
    }

    setIsPosting(true);
    const content = `${selectedIdea.hook}\n\n${drafts[selectedIdea.id] ?? selectedIdea.content}`;
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedIdea.platform, content })
      });
      const data = await res.json();
      if (data.success) {
        setState('DASHBOARD');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  const deleteScheduled = async (id: string) => {
    if (!isOnline) {
      setShowOfflineToast(true);
      return;
    }
    try {
      await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      fetchScheduled();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-accent/30 overflow-x-hidden">
      {/* Background elements */}
      <div className="mesh-bg" />

      {/* Offline Toast */}
      <AnimatePresence>
        {(!isOnline || showOfflineToast) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 glass-card bg-red-500/20 border-red-500/50 flex items-center gap-3 backdrop-blur-3xl"
          >
            <WifiOff className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium">Offline Mode: Using cached data</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-24">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 md:mb-16">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setState('INGESTION')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] transform group-hover:rotate-12 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">SocialGenius</h1>
          </div>
          
          {(state !== 'INGESTION' && state !== 'ANALYSIS') && (
            <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
              {[
                { id: 'DASHBOARD', icon: Globe, label: 'Feed' },
                { id: 'ANALYTICS', icon: BarChart3, label: 'Metrics' },
                { id: 'SCHEDULE', icon: Calendar, label: 'Calendar' },
                { id: 'ACCOUNTS', icon: ShieldCheck, label: 'Profiles' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setState(tab.id as AppState)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${state === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className={state === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {state === 'INGESTION' && (
            <motion.div
              key="ingestion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center"
            >
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
          )}

          {state === 'ANALYSIS' && (
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
          )}

          {state === 'DASHBOARD' && profile && (
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
                    onClick={() => handleStartAnalysis()} 
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
                      onClick={() => handleSelectIdea(idea)}
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
                  
                  <button onClick={() => setState('INGESTION')} className="p-6 rounded-2xl border border-dashed border-white/20 bg-white/3 flex flex-col items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-all">
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Custom Draft</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'ANALYTICS' && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Connection Status Banner */}
              {(!accounts.linkedin || !accounts.x) && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Unlock Real-Time Data</p>
                      <p className="text-xs text-indigo-300/60">Connect your profiles to replace simulations with actual engagement metrics.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setState('ACCOUNTS')}
                    className="px-6 py-2 bg-indigo-500 rounded-xl text-xs font-bold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Connect Now
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2 glass-card p-8 flex flex-col justify-center">
                  <h3 className="text-white/40 text-sm font-medium mb-2">Total Impressions</h3>
                  <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-brand-teal">
                    {analytics.totalEngagement.toLocaleString()}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    +{analytics.growth}% vs last month
                  </div>
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Post Success</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-accent border-r-transparent animate-spin" />
                    <div>
                      <div className="text-xl font-bold">A+ Tier</div>
                      <div className="text-xs text-white/40">Engagement Index</div>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Active Days</h3>
                  <div className="flex gap-2 h-16 items-end">
                    {[3, 5, 8, 4, 10, 6, 9].map((h, i) => (
                      <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h * 10}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-card p-8">
                  <h3 className="text-lg font-bold mb-6">Channel Performance</h3>
                  <div className="space-y-6">
                    {analytics.platforms.map((p: any) => (
                      <div key={p.name} className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          {p.name === 'LinkedIn' ? <Linkedin className="w-5 h-5 text-blue-400" /> : <Twitter className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 border-b border-white/5 pb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-white/40 text-sm">{p.likes + p.shares + p.comments} interactions</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-[10px] text-white/40">LIKES: {p.likes}</span>
                            <span className="text-[10px] text-white/40">SHARES: {p.shares}</span>
                            <span className="text-[10px] text-white/40">COMMENTS: {p.comments}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-8">
                  <h3 className="text-lg font-bold mb-6">Audience Growth</h3>
                  <div className="flex items-center justify-center py-10">
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 rounded-full border-[10px] border-accent/20" />
                      <div className="absolute inset-0 rounded-full border-[10px] border-accent border-r-transparent border-b-transparent transform -rotate-45" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">8.2k</span>
                        <span className="text-[10px] text-white/40 uppercase">New Followers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Recent Post Performance</h3>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Detailed Metrics</div>
                </div>
                <div className="space-y-4">
                  {analytics.recentPostPerformance.map((post: any) => (
                    <div key={post.id} className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all hover:bg-white/[0.05] group">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 transform group-hover:scale-110 transition-transform`}>
                            {post.platform === 'LinkedIn' ? <Linkedin className="w-6 h-6 text-blue-400" /> : <Twitter className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-base md:text-lg">{post.title}</h4>
                            <p className="text-xs text-white/30">{post.date}</p>
                          </div>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-sm">
                          {post.engagement}% Interaction Rate
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 rounded-2xl bg-white/3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Total Reach</p>
                          <p className="text-xl font-display font-bold">{(post.reach / 1000).toFixed(1)}K</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Likes</p>
                          <p className="text-xl font-display font-bold text-indigo-300">{post.likes.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Shares</p>
                          <p className="text-xl font-display font-bold text-teal-300">{post.shares.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Comments</p>
                          <p className="text-xl font-display font-bold text-accent">{post.comments.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {state === 'SCHEDULE' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">Content Schedule</h2>
                <button 
                  onClick={() => setState('DASHBOARD')}
                  className="px-6 py-2 glass-button text-xs"
                >
                  New Draft
                </button>
              </div>

              {scheduledPosts.length === 0 ? (
                <div className="glass-card p-20 text-center flex flex-col items-center gap-4">
                  <Calendar className="w-12 h-12 text-white/10" />
                  <p className="text-white/40">No posts scheduled. Start by creating an idea.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map((p) => (
                    <div key={p.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex flex-col items-center justify-center text-accent">
                          <span className="text-[10px] font-bold">{new Date(p.scheduleAt).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-lg font-bold">{new Date(p.scheduleAt).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">{p.idea.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1 uppercase font-bold tracking-wider">{p.platform}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.scheduleAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleEditScheduled(p)}
                          className="p-3 rounded-xl glass-card text-white/40 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-3 rounded-xl glass-card text-white/40 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteScheduled(p.id)}
                          className="p-3 rounded-xl glass-card text-red-400/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {state === 'ACCOUNTS' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h2 className="text-3xl font-display font-bold text-center">Connected Profiles</h2>
              <p className="text-center text-white/40">Manage your connected social accounts and app preferences.</p>
              
              <div className="grid gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-2">Platforms</h3>
                  {[
                    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
                    { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'text-white' }
                  ].map((plat) => (
                    <div key={plat.id} className="glass-card p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <plat.icon className={`w-6 h-6 ${plat.color}`} />
                        </div>
                        <div>
                          <h4 className="font-bold">{plat.label}</h4>
                          <p className="text-xs text-white/40">{(accounts as any)[plat.id] ? 'Authenticated' : 'Not setup'}</p>
                        </div>
                      </div>
                      { (accounts as any)[plat.id] ? (
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          CONNECTED
                        </div>
                      ) : (
                        <button onClick={() => handleConnect(plat.id)} className="glass-button !py-2 !px-6 text-xs">Connect</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-2">App Settings</h3>
                  <div className="glass-card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                        <MousePointer2 className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-bold">Minimal Interface</h4>
                        <p className="text-xs text-white/40">Hide all system scrollbars for a cleaner look.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setHideScrollbars(!hideScrollbars)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${hideScrollbars ? 'bg-accent' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: hideScrollbars ? 24 : 4 }}
                        className="w-4 h-4 bg-white rounded-full mt-1 ml-0.5"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'EDITOR' && selectedIdea && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-12 flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setState('DASHBOARD')}
                  className="p-2 rounded-xl glass-card hover:bg-white/10"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-display font-bold">Refining Idea</h2>
              </div>

              <div className="lg:col-span-8 rounded-[32px] bg-white/[0.05] backdrop-blur-3xl border border-white/20 p-8 flex flex-col min-h-[600px]">
                {/* Platform Tabs */}
                <div 
                  className="flex gap-4 mb-8 border-b border-white/10 pb-6 overflow-x-auto scrollbar-hide" 
                  role="tablist" 
                  aria-label="Social Media Platforms"
                  onKeyDown={(e) => {
                    const tabs = ['X', 'LinkedIn', 'Substack', 'Reddit'];
                    const currentIdx = tabs.findIndex(t => selectedIdea.platform.toLowerCase().includes(t.toLowerCase()));
                    if (e.key === 'ArrowRight') {
                      const next = tabs[(currentIdx + 1) % tabs.length];
                      handleChangePlatform(next);
                    } else if (e.key === 'ArrowLeft') {
                      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
                      handleChangePlatform(prev);
                    }
                  }}
                >
                  {[
                    { id: 'X', label: 'X Thread', icon: Twitter, limit: 280 },
                    { id: 'LinkedIn', label: 'LinkedIn Post', icon: Linkedin, limit: 3000 },
                    { id: 'Substack', label: 'Substack Memo', icon: Globe, limit: 10000 },
                    { id: 'Reddit', label: 'Reddit Post', icon: LayoutGrid, limit: 40000 }
                  ].map((p) => {
                    const isActive = selectedIdea.platform.toLowerCase().includes(p.id.toLowerCase());
                    const currentContent = drafts[selectedIdea.id] ?? selectedIdea.content;
                    const isOverLimit = currentContent.length > p.limit;

                    return (
                      <button
                        key={p.id}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Switch to ${p.label} format`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => handleChangePlatform(p.label)}
                        className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-bold transition-all relative whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activeTabEditor"
                            className="absolute inset-0 bg-gradient-to-r from-accent to-indigo-600 rounded-full shadow-[0_5px_15px_rgba(99,102,241,0.4)]"
                            transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                          />
                        )}
                        <p.icon className={`w-4 h-4 relative z-10 transition-transform ${isActive ? 'scale-110' : 'opacity-50 group-hover:opacity-100 group-hover:scale-105'}`} />
                        <span className="relative z-10">{p.label}</span>
                        {isActive && (
                          <span className={`relative z-10 text-[8px] px-1.5 py-0.5 rounded-full ml-1 ${isOverLimit ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'}`}>
                            {currentContent.length}/{p.limit}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Editor Content */}
                <div className="flex-1 space-y-4">
                   <div className="flex items-center justify-between mb-4">
                     <div className="font-bold text-accent/80 flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded bg-accent/20 text-[10px] tracking-widest text-accent">[HOOK]</span>
                       {selectedIdea.hook}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-white/20">
                       {isSaving ? (
                          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity }}>SAVING...</motion.span>
                       ) : (
                         <span className="flex items-center gap-1"><Check className="w-3 h-3" /> AUTO-SAVED</span>
                       )}
                     </div>
                   </div>
                   <textarea 
                    className="w-full flex-1 bg-transparent border-none outline-none text-lg font-light leading-relaxed text-white/90 scrollbar-hide resize-none min-h-[250px]"
                    value={drafts[selectedIdea.id] ?? selectedIdea.content}
                    onChange={(e) => handleUpdateDraft(selectedIdea.id, e.target.value)}
                   />
                </div>

                {/* Hooks Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Alternative Hooks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loadingHooks ? Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-20 glass-card animate-pulse" />
                    )) : altHooks.map((h, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleReplaceHook(h)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs leading-snug hover:border-accent/50 cursor-pointer transition-colors"
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-8 flex flex-wrap justify-between items-center bg-white/5 p-4 rounded-2xl gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={loadHooks} 
                      disabled={!isOnline && altHooks.length === 0}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-3.5 h-3.5 ${loadingHooks ? 'animate-spin' : ''}`} />
                      {(!isOnline && altHooks.length > 0) ? 'Cached Hooks' : 'Regenerate'}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsScheduling(!isScheduling)} 
                      className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-colors ${isScheduling ? 'bg-accent border-accent text-white' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                    >
                      {isScheduling ? 'Cancel' : 'Schedule'}
                    </button>
                    {(accounts as any)[selectedIdea.platform.toLowerCase().includes('linkedin') ? 'linkedin' : 'x'] && (
                      <button 
                        onClick={handlePostNow}
                        disabled={isPosting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                      >
                        {isPosting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post Now
                      </button>
                    )}
                    <button 
                      onClick={() => handleCopy(`${selectedIdea.hook}\n\n${drafts[selectedIdea.id] ?? selectedIdea.content}`)}
                      className="px-6 py-2.5 rounded-xl glass-button text-xs font-bold flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Draft'}
                    </button>
                  </div>
                </div>

                {isScheduling && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-6 md:p-8 glass-card border-accent/30 bg-accent/5 overflow-hidden shadow-2xl relative"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-5 blur-[60px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-300">Target Schedule</h4>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        {selectedIdea.platform === 'LinkedIn' ? <Linkedin className="w-3.5 h-3.5 text-blue-400" /> : 
                         selectedIdea.platform === 'X' ? <Twitter className="w-3.5 h-3.5" /> : 
                         <Globe className="w-3.5 h-3.5 text-orange-400" />}
                        <span className="text-[10px] font-bold uppercase">{selectedIdea.platform}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="group">
                        <label className="block text-[10px] uppercase font-bold text-white/30 mb-3 group-focus-within:text-accent transition-colors">Publish Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type="date" 
                            className="w-full glass-input !py-4 !pl-12 !bg-white/[0.02] focus:!bg-white/[0.05]"
                            onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] uppercase font-bold text-white/30 mb-3 group-focus-within:text-accent transition-colors">Publish Time</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type="time" 
                            className="w-full glass-input !py-4 !pl-12 !bg-white/[0.02] focus:!bg-white/[0.05]"
                            onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleSchedulePost}
                      disabled={!scheduleData.date || !scheduleData.time}
                      className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl font-bold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.3)] disabled:opacity-30 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Check className="w-4 h-4" />
                      Plan {selectedIdea.platform} Drop
                    </button>
                    
                    <p className="mt-4 text-[10px] text-center text-white/20 font-medium">
                      Automated publishing enabled for linked accounts
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Sidebar: Optimization */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-300 mb-6">Optimization Pulse</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs text-white/50 mb-2">
                        <span>Est. Reach</span>
                        <span className="text-white font-bold">12.8k</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] accent-gradient" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-white/40 mb-2 font-bold uppercase tracking-wider">AI Advice</p>
                    <p className="text-xs text-white/70 leading-relaxed italic">"Adding an industry-specific hashtag could boost reach by 4.2% on {selectedIdea.platform}."</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating navigation for mobile */}
      {(state !== 'INGESTION' && state !== 'ANALYSIS') && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden glass-card p-1.5 rounded-full flex gap-1 shadow-2xl z-[90]">
          {[
            { id: 'DASHBOARD', icon: Globe },
            { id: 'ANALYTICS', icon: BarChart3 },
            { id: 'SCHEDULE', icon: Calendar },
            { id: 'ACCOUNTS', icon: ShieldCheck }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setState(tab.id as AppState)} 
              className={`p-3.5 rounded-full transition-all ${state === tab.id ? 'bg-accent text-white' : 'text-white/30 hover:text-white'}`}
            >
              <tab.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
