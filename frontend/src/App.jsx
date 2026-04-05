import { useState, useEffect } from 'react'
import { Sun, Moon, Activity, Camera, Radio, LayoutDashboard, LogOut, Settings, Tractor } from 'lucide-react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import { Globe } from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import PredictionEngine from './pages/PredictionEngine'
import IoTDashboard from './pages/IoTDashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FarmManager from './pages/FarmManager'
import AdminDashboard from './pages/AdminDashboard'
import FloatingChatbot from './components/SmartAssistant/FloatingChatbot'

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// Layout Component with Navigation
const AppLayout = ({ children }) => {
  const { user, logout, activeFarmId } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agrishield-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('agrishield-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const tabs = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={16} /> },
    { path: '/iot', label: t('nav.iot_sensors'), icon: <Radio size={16} /> },
    { path: '/plantscan', label: t('nav.plantscan'), icon: <Camera size={16} /> },
    { path: '/prediction', label: t('nav.prediction_engine'), icon: <Activity size={16} /> }
  ]

  if (user?.role === 'admin') {
    tabs.push({ path: '/admin', label: t('nav.admin_hub'), icon: <Settings size={16} /> });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 w-full flex-1 flex flex-col">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 animate-fade-in-down gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-br from-primary-color to-accent-color bg-clip-text text-transparent mb-1">AgriShield AI</h1>
          <p className="text-text-secondary text-sm md:text-lg">SaaS Plant Protection & Disease Management System</p>
        </div>

        <div className="flex gap-4 items-center">
          {/* Active Farm Display */}
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
             <Tractor size={18} className="text-primary-color" />
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Active Farm</span>
               <span className="text-sm font-black text-white">{activeFarmId ? `Farm [${activeFarmId.substring(0,6)}]` : 'No Farm Selected'}</span>
             </div>
             <button onClick={() => navigate('/farms')} className="ml-2 text-[10px] bg-primary-color px-2 py-1 rounded-md text-white font-bold tracking-widest hover:bg-emerald-500 uppercase">Change</button>
          </div>

          <div className="relative group">
             <div className="bg-panel-bg/40 border border-white/20 backdrop-blur-xl px-4 py-2.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Globe size={18} className="text-primary-color group-hover:animate-pulse" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-sm font-black uppercase tracking-[0.1em] outline-none cursor-pointer appearance-none text-white pr-2"
                >
                  <option value="en" className="text-black bg-white">English (EN)</option>
                  <option value="hi" className="text-black bg-white">हिंदी (HI)</option>
                  <option value="mr" className="text-black bg-white">मराठी (MR)</option>
                </select>
             </div>
          </div>

          <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-xl bg-panel-bg border border-panel-border backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg text-white"
          >
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-500" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:bg-red-500 hover:text-white"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-10 shadow-xl w-fit mx-auto flex-wrap justify-center">
        {tabs.map(({ path, label, icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-primary-color text-white shadow-lg shadow-primary-color/20 scale-[1.02]'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Global Chatbot */}
      <FloatingChatbot />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected Main Application Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/prediction" element={<ProtectedRoute><AppLayout><PredictionEngine /></AppLayout></ProtectedRoute>} />
      <Route path="/plantscan" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
      <Route path="/iot" element={<ProtectedRoute><AppLayout><IoTDashboard /></AppLayout></ProtectedRoute>} />
      
      {/* Farm Management Route */}
      <Route path="/farms" element={<ProtectedRoute><AppLayout><FarmManager /></AppLayout></ProtectedRoute>} />
      
      {/* Admin Route */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
    </Routes>
  )
}

export default App
