import { useState, useEffect } from 'react';
import { Users, Server, Activity, ArrowRight, Loader2, Database, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../config/api';
import { useSettings } from '../context/SettingsContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { modeSelectionEnabled, updateSettings, loadingSettings } = useSettings();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModeSelection = async () => {
    try {
        await updateSettings(!modeSelectionEnabled);
    } catch (e) {
        alert("Failed to update global settings.");
    }
  };

  if (loading || loadingSettings) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary-color" size={48} /></div>;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="glass-panel p-8 rounded-[40px] flex justify-between items-center bg-gradient-to-r from-accent-color/10 to-transparent border border-accent-color/20 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
             <Server className="text-accent-color" /> SaaS Admin Hub
          </h2>
          <p className="text-text-secondary mt-1">Monitor system performance, user limits, and API usage.</p>
        </div>
        <div className="flex gap-4">
           {/* Mode Selection Control */}
           <button 
              onClick={handleToggleModeSelection}
              className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-2 transition-all ${
                 modeSelectionEnabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
              }`}
           >
              {modeSelectionEnabled ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} />}
              {modeSelectionEnabled ? "Farmer Mode Selection: ENABLED" : "Farmer Mode Selection: DISABLED"}
           </button>
           <div className="bg-accent-color/20 text-accent-color px-4 py-2 rounded-xl font-bold border border-accent-color/30 flex items-center gap-2">
              <Activity size={18} /> System Online
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-8 rounded-[32px] border border-white/10 group hover:border-accent-color/50 transition-colors">
          <Users size={32} className="text-accent-color mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-4xl font-black text-white">{stats?.totalUsers || 0}</h3>
        </div>
        <div className="glass-panel p-8 rounded-[32px] border border-white/10 group hover:border-emerald-500/50 transition-colors">
          <Database size={32} className="text-emerald-500 mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-1">Total Farms</p>
          <h3 className="text-4xl font-black text-white">{stats?.totalFarms || 0}</h3>
        </div>
        <div className="glass-panel p-8 rounded-[32px] border border-white/10 group hover:border-purple-500/50 transition-colors">
          <Zap size={32} className="text-purple-500 mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-1">System Load</p>
          <h3 className="text-4xl font-black text-white">{stats?.systemLoad || 'Low'}</h3>
        </div>
        <div className="glass-panel p-8 rounded-[32px] border border-white/10 group hover:border-orange-500/50 transition-colors">
          <Activity size={32} className="text-orange-500 mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-sm font-bold uppercase tracking-widest mb-1">Inferences (24h)</p>
          <h3 className="text-4xl font-black text-white">{stats?.totalInferences || 0}</h3>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[40px] border border-white/10 bg-black/20">
         <h3 className="text-xl font-bold text-white mb-6">Recent Users</h3>
         <div className="space-y-4">
            {stats?.recentUsers?.map((u) => (
                <div key={u._id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">{u.email.substring(0,1).toUpperCase()}</div>
                      <div>
                         <p className="font-bold text-white">{u.email}</p>
                         <p className="text-xs text-text-secondary">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="flex gap-2 text-xs font-bold uppercase tracking-widest">
                      {u.role === 'admin' && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg">Admin</span>}
                      <span className={u.subscriptionTier === 'premium' ? "bg-amber-500/20 text-amber-500 px-3 py-1 rounded-lg" : "bg-white/10 text-white/50 px-3 py-1 rounded-lg"}>{u.subscriptionTier}</span>
                   </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}
