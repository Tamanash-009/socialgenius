import { motion } from 'framer-motion';
import { Globe, BarChart3, Calendar, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn';

interface NavigationProps {
  state: string;
  setState: (state: string) => void;
}

export function Navigation({ state, setState }: NavigationProps) {
  const tabs = [
    { id: 'DASHBOARD', icon: Globe, label: 'Feed' },
    { id: 'ANALYTICS', icon: BarChart3, label: 'Metrics' },
    { id: 'SCHEDULE', icon: Calendar, label: 'Calendar' },
    { id: 'ACCOUNTS', icon: ShieldCheck, label: 'Profiles' }
  ];

  if (state === 'INGESTION' || state === 'ANALYSIS') return null;

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 w-auto overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setState(tab.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
              state === tab.id ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden glass-card p-1.5 rounded-full flex gap-1 shadow-2xl z-[90]">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setState(tab.id)} 
            className={cn(
              "p-3.5 rounded-full transition-all relative flex items-center justify-center min-w-[44px] min-h-[44px]",
              state === tab.id ? "text-white" : "text-white/30 hover:text-white"
            )}
            aria-label={tab.label}
          >
            {state === tab.id && (
              <motion.div 
                layoutId="mobileNav"
                className="absolute inset-0 bg-accent rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </>
  );
}
