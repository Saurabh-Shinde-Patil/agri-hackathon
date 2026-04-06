import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tractor, Plus, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../config/api';

export default function FarmManager() {
  const { selectFarm, activeFarmId } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data);
    } catch (e) {
      console.error('Failed to fetch farms:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/farms', { name: newFarmName, location: newFarmLocation });
      setFarms([...farms, data]);
      setNewFarmName('');
      setNewFarmLocation('');
      setIsCreating(false);
      if (!activeFarmId) selectFarm(data.farm_id);
    } catch (e) {
      console.error("Failed to create farm", e);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary-color" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[40px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-color/10 to-transparent border border-primary-color/20">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary">Farm Management</h2>
          <p className="text-text-secondary mt-1 text-sm">Select an active farm context or create a new IoT gateway</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary-color hover:bg-emerald-400 !text-white px-5 sm:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105 text-sm"
        >
          <Plus size={18} /> Add New Farm
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateFarm} className="glass-panel p-6 sm:p-8 rounded-[28px] sm:rounded-[40px] border border-panel-border space-y-4 animate-fade-in-down theme-surface-overlay">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">Register New Farm</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required value={newFarmName} onChange={e => setNewFarmName(e.target.value)}
              placeholder="Farm Name (e.g., North Field)" 
              className="theme-input border rounded-2xl p-4 focus:border-primary-color focus:outline-none"
            />
            <input 
              required value={newFarmLocation} onChange={e => setNewFarmLocation(e.target.value)}
              placeholder="Location Settings" 
              className="theme-input border rounded-2xl p-4 focus:border-primary-color focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsCreating(false)} className="px-5 sm:px-6 py-3 rounded-xl font-bold text-text-secondary hover:bg-surface-hover transition-all">Cancel</button>
            <button type="submit" className="px-5 sm:px-6 py-3 bg-primary-color !text-white rounded-xl font-bold">Save Farm Gateway</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {farms.length === 0 ? (
          <div className="col-span-full text-center p-8 sm:p-12 text-text-secondary theme-surface rounded-3xl border border-panel-border">
            <Tractor size={40} className="mx-auto mb-4 opacity-50" />
            <p>You haven't registered any farms yet.</p>
          </div>
        ) : (
          farms.map((farm) => (
            <div 
              key={farm.farm_id} 
              onClick={() => selectFarm(farm.farm_id)}
              className={`p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border relative cursor-pointer transition-all hover:scale-[1.02] ${activeFarmId === farm.farm_id ? 'bg-primary-color/10 border-primary-color shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'theme-surface border-panel-border hover:bg-surface-hover'}`}
            >
               {activeFarmId === farm.farm_id && (
                 <div className="absolute top-4 right-4 text-primary-color">
                   <CheckCircle2 size={22} />
                 </div>
               )}
               <Tractor size={28} className={`mb-3 sm:mb-4 ${activeFarmId === farm.farm_id ? 'text-primary-color' : 'text-text-secondary'}`} />
               <h3 className="text-lg sm:text-xl font-black text-text-primary mb-1">{farm.name}</h3>
               <p className="text-sm text-text-secondary flex items-center gap-1 mb-3 sm:mb-4">
                 <MapPin size={12} /> {farm.location}
               </p>
               <div className="theme-surface-overlay font-mono text-xs rounded-lg p-2 text-text-secondary break-all border border-panel-border">
                  ID: {farm.farm_id}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
