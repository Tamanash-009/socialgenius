import { motion } from 'framer-motion';
import { Linkedin, Twitter, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Accounts() {
  const { accounts, setAccounts } = useAppStore();

  const toggleAccount = (platform: 'linkedin' | 'x') => {
    setAccounts({ ...accounts, [platform]: !accounts[platform] });
  };

  return (
    <motion.div
      key="accounts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/20 text-accent rounded-xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display">Connected Profiles</h2>
          <p className="text-sm text-white/40">Manage your connected social platforms securely.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* LinkedIn */}
        <div className="glass-card p-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between group transition-all hover:border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0A66C2]/20 flex items-center justify-center flex-shrink-0">
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">LinkedIn</h3>
              <p className="text-sm text-white/40">Professional Network</p>
            </div>
          </div>
          <button 
            onClick={() => toggleAccount('linkedin')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              accounts.linkedin 
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {accounts.linkedin ? <><CheckCircle2 className="w-4 h-4" /> Connected</> : 'Connect'}
          </button>
        </div>

        {/* X / Twitter */}
        <div className="glass-card p-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between group transition-all hover:border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Twitter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">X (Twitter)</h3>
              <p className="text-sm text-white/40">Micro-blogging</p>
            </div>
          </div>
          <button 
            onClick={() => toggleAccount('x')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              accounts.x 
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {accounts.x ? <><CheckCircle2 className="w-4 h-4" /> Connected</> : 'Connect'}
          </button>
        </div>

        {/* Substack (Coming Soon) */}
        <div className="glass-card p-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between opacity-50 grayscale cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FF6719]/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-[#FF6719]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Substack</h3>
              <p className="text-sm text-white/40">Newsletters</p>
            </div>
          </div>
          <button disabled className="px-6 py-2.5 rounded-full text-sm font-bold bg-white/5 text-white/30 border border-white/5">
            Coming Soon
          </button>
        </div>
      </div>
    </motion.div>
  );
}
