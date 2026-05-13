import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Navigation } from './components/Navigation';
import { Skeleton } from './components/Skeleton';
import { PostIdea } from './services/geminiService';

// Lazy load heavy components for route-based code splitting
const Ingestion = lazy(() => import('./pages/Ingestion'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Editor = lazy(() => import('./pages/Editor'));

function LoadingFallback() {
  return (
    <div className="w-full h-[60vh] flex flex-col gap-6">
      <Skeleton className="w-1/3 h-8 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

function App() {
  const { profile, selectedIdea, setSelectedIdea } = useAppStore();
  const [appState, setAppState] = useState<'INGESTION' | 'DASHBOARD' | 'ANALYTICS' | 'SCHEDULE' | 'ACCOUNTS' | 'EDITOR'>('INGESTION');

  // Handle initial state routing
  if (profile && appState === 'INGESTION') {
    setAppState('DASHBOARD');
  }

  const renderContent = () => {
    switch (appState) {
      case 'INGESTION':
        return <Ingestion onNext={() => setAppState('DASHBOARD')} />;
      case 'DASHBOARD':
        return (
          <Dashboard 
            onSelectIdea={(idea: PostIdea) => {
              setSelectedIdea(idea);
              setAppState('EDITOR');
            }} 
            onNewDraft={() => {
              setSelectedIdea({
                id: Date.now().toString(),
                title: 'Custom Draft',
                platform: 'LinkedIn',
                engagement: 'TBD',
                hook: '',
                content: '',
                category: 'Custom'
              });
              setAppState('EDITOR');
            }} 
          />
        );
      case 'EDITOR':
        return <Editor onBack={() => setAppState('DASHBOARD')} />;
      case 'ANALYTICS':
        return <Analytics />;
      case 'SCHEDULE':
        return <Schedule />;
      case 'ACCOUNTS':
        return <Accounts />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0118] text-white selection:bg-accent/30 selection:text-white pb-24 md:pb-8">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-purple-900/20 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 min-h-screen flex flex-col">
        
        {/* Top Header */}
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => profile && setAppState('DASHBOARD')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-[#0A0118] flex items-center justify-center">
                <span className="font-display font-bold text-lg">SG</span>
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold tracking-tight leading-none text-xl">SocialGenius</h1>
              <p className="text-[10px] uppercase tracking-widest text-accent font-bold mt-0.5">Enterprise</p>
            </div>
          </div>
          
          <Navigation state={appState} setState={(s: string) => setAppState(s as any)} />
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
