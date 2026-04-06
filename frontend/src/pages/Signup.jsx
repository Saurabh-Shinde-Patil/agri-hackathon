import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, Loader2, Award } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { email, password });
      login(data.token, data.email, data.role, data.subscriptionTier);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-panel-border shadow-2xl relative overflow-hidden group focus-within:border-accent-color/50 transition-colors">
        
        <div className="absolute -top-20 -right-20 opacity-[0.03] group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
          <Award size={250} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-accent-color/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-accent-color/30">
              <Award size={28} className="text-accent-color" />
            </div>
          </div>
          
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary mb-2 tracking-tight">Join AgriShield</h1>
            <p className="text-text-secondary text-sm">Start managing your farms with AI intelligently</p>
          </div>

          <div className="mb-6 flex gap-2 justify-center items-center py-2 px-4 rounded-xl bg-gradient-to-r from-accent-color/20 to-primary-color/20 border border-panel-border text-sm font-bold text-text-primary">
             <span className="text-yellow-400">✨</span> Includes 14-Day Free Premium Trial
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-4 rounded-xl mb-6 text-center font-bold animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 group-focus-within:text-accent-color transition-colors" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full theme-input border rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 focus:outline-none focus:border-accent-color/50 transition-all font-medium"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 group-focus-within:text-accent-color transition-colors" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Password"
                className="w-full theme-input border rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 focus:outline-none focus:border-accent-color/50 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-color hover:bg-blue-400 !text-white font-black rounded-2xl py-3.5 sm:py-4 mt-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_5px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_5px_25px_rgba(59,130,246,0.5)]"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6 sm:mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-color font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
