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
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="glass-panel p-8 rounded-[40px] flex justify-between items-center bg-gradient-to-r from-primary-color/10 to-transparent border border-primary-color/20">
        <div>
          <h2 className="text-3xl font-black text-white">Farm Management</h2>
          <p className="text-text-secondary mt-1">Select an active farm context or create a new IoT gateway</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary-color hover:bg-emerald-400 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105"
        >
          <Plus size={20} /> Add New Farm
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateFarm} className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-4 animate-fade-in-down bg-black/20">
          <h3 className="text-xl font-bold text-white mb-4">Register New Farm</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required value={newFarmName} onChange={e => setNewFarmName(e.target.value)}
              placeholder="Farm Name (e.g., North Field)" 
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:border-primary-color"
            />
            <input 
              required value={newFarmLocation} onChange={e => setNewFarmLocation(e.target.value)}
              placeholder="Location Settings" 
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:border-primary-color"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-xl font-bold text-text-secondary hover:bg-white/5">Cancel</button>
            <button type="submit" className="px-6 py-3 bg-primary-color text-white rounded-xl font-bold">Save Farm Gateway</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.length === 0 ? (
          <div className="col-span-full text-center p-12 text-text-secondary bg-white/5 rounded-3xl border border-white/5">
            <Tractor size={48} className="mx-auto mb-4 opacity-50" />
            <p>You haven't registered any farms yet.</p>
          </div>
        ) : (
          farms.map((farm) => (
            <div 
              key={farm.farm_id} 
              onClick={() => selectFarm(farm.farm_id)}
              className={`p-6 rounded-[32px] border relative cursor-pointer transition-all hover:scale-[1.02] ${activeFarmId === farm.farm_id ? 'bg-primary-color/10 border-primary-color shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
               {activeFarmId === farm.farm_id && (
                 <div className="absolute top-4 right-4 text-primary-color">
                   <CheckCircle2 size={24} />
                 </div>
               )}
               <Tractor size={32} className={`mb-4 ${activeFarmId === farm.farm_id ? 'text-primary-color' : 'text-white/50'}`} />
               <h3 className="text-xl font-black text-white mb-1">{farm.name}</h3>
               <p className="text-sm text-text-secondary flex items-center gap-1 mb-4">
                 <MapPin size={12} /> {farm.location}
               </p>
               <div className="bg-black/20 font-mono text-xs rounded-lg p-2 text-white/50 break-all border border-black/30">
                  ID: {farm.farm_id}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
