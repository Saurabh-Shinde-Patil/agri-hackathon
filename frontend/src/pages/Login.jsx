import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.email, data.role, data.subscriptionTier);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-10 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group focus-within:border-primary-color/50 transition-colors">
        
        <div className="absolute -top-20 -right-20 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
          <Shield size={250} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-primary-color/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-primary-color/30">
              <Shield size={32} className="text-primary-color" />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-text-secondary text-sm">Sign in to AgriShield AI Platform</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-4 rounded-xl mb-6 text-center font-bold animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-color transition-colors" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary-color/50 focus:bg-white/10 transition-all font-medium"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary-color transition-colors" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary-color/50 focus:bg-white/10 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-color hover:bg-emerald-400 text-white font-black rounded-2xl py-4 mt-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_5px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_5px_25px_rgba(16,185,129,0.5)]"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Log In & Access Data'}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-color font-bold hover:underline">
              Sign Up for Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
