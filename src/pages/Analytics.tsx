import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, BarChart2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Analytics() {
  const { profile } = useAppStore();

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-display">Performance Metrics</h2>
        <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest text-white/50">
          Last 30 Days
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reach', value: '24.5K', change: '+12%', icon: Users, color: 'text-indigo-400' },
          { label: 'Engagement Rate', value: `${profile?.engagementRate || 0}%`, change: '+2.4%', icon: Activity, color: 'text-teal-400' },
          { label: 'Conversion', value: '3.2%', change: '+0.8%', icon: TrendingUp, color: 'text-orange-400' },
          { label: 'Post Views', value: '142K', change: '+24%', icon: BarChart2, color: 'text-pink-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-2 py-1 rounded">{stat.change}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 h-64 flex items-center justify-center border border-white/5">
        <p className="text-white/30 text-sm font-mono flex items-center gap-2">
          <BarChart2 className="w-4 h-4" /> Comprehensive charts will appear here as data populates.
        </p>
      </div>
    </motion.div>
  );
}
