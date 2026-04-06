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
    <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[40px] flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-accent-color/10 to-transparent border border-accent-color/20 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
             <Server className="text-accent-color shrink-0" /> SaaS Admin Hub
          </h2>
          <p className="text-text-secondary mt-1 text-sm">Monitor system performance, user limits, and API usage.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
           {/* Mode Selection Control */}
           <button 
              onClick={handleToggleModeSelection}
              className={`px-3 sm:px-4 py-2 rounded-xl font-bold border flex items-center gap-2 transition-all text-sm ${
                 modeSelectionEnabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                    : 'theme-surface text-text-secondary border-panel-border hover:bg-surface-hover'
              }`}
           >
              {modeSelectionEnabled ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
              <span className="hidden sm:inline">{modeSelectionEnabled ? "Farmer Mode Selection: ENABLED" : "Farmer Mode Selection: DISABLED"}</span>
              <span className="sm:hidden">{modeSelectionEnabled ? "Enabled" : "Disabled"}</span>
           </button>
           <div className="bg-accent-color/20 text-accent-color px-3 sm:px-4 py-2 rounded-xl font-bold border border-accent-color/30 flex items-center gap-2 text-sm">
              <Activity size={16} /> <span className="hidden sm:inline">System</span> Online
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-panel-border group hover:border-accent-color/50 transition-colors">
          <Users size={28} className="text-accent-color mb-3 sm:mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-2xl sm:text-4xl font-black text-text-primary">{stats?.totalUsers || 0}</h3>
        </div>
        <div className="glass-panel p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-panel-border group hover:border-emerald-500/50 transition-colors">
          <Database size={28} className="text-emerald-500 mb-3 sm:mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">Total Farms</p>
          <h3 className="text-2xl sm:text-4xl font-black text-text-primary">{stats?.totalFarms || 0}</h3>
        </div>
        <div className="glass-panel p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-panel-border group hover:border-purple-500/50 transition-colors">
          <Zap size={28} className="text-purple-500 mb-3 sm:mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">System Load</p>
          <h3 className="text-2xl sm:text-4xl font-black text-text-primary">{stats?.systemLoad || 'Low'}</h3>
        </div>
        <div className="glass-panel p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-panel-border group hover:border-orange-500/50 transition-colors">
          <Activity size={28} className="text-orange-500 mb-3 sm:mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <p className="text-text-secondary text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">Inferences (24h)</p>
          <h3 className="text-2xl sm:text-4xl font-black text-text-primary">{stats?.totalInferences || 0}</h3>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[40px] border border-panel-border theme-surface-overlay">
         <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 sm:mb-6">Recent Users</h3>
         <div className="space-y-3 sm:space-y-4">
            {stats?.recentUsers?.map((u) => (
                <div key={u._id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 theme-surface p-3 sm:p-4 rounded-2xl border border-panel-border">
                   <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full theme-surface border border-panel-border flex items-center justify-center font-bold text-text-primary shrink-0">{u.email.substring(0,1).toUpperCase()}</div>
                      <div className="min-w-0">
                         <p className="font-bold text-text-primary truncate">{u.email}</p>
                         <p className="text-xs text-text-secondary">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="flex gap-2 text-xs font-bold uppercase tracking-widest shrink-0">
                      {u.role === 'admin' && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg">Admin</span>}
                      <span className={u.subscriptionTier === 'premium' ? "bg-amber-500/20 text-amber-500 px-3 py-1 rounded-lg" : "theme-badge px-3 py-1 rounded-lg text-text-secondary"}>{u.subscriptionTier}</span>
                   </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}
