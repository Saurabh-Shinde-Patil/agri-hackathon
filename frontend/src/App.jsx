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
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8 w-full flex-1 flex flex-col">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 mb-6 md:mb-8 animate-fade-in-down">
        {/* Row 1: Brand + Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-br from-primary-color to-accent-color bg-clip-text text-transparent mb-0.5 truncate">AgriShield AI</h1>
            <p className="text-text-secondary text-xs sm:text-sm md:text-lg truncate">SaaS Plant Protection & Disease Management</p>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center shrink-0">
            {/* Language Selector */}
            <div className="relative group">
               <div className="bg-panel-bg border border-panel-border backdrop-blur-xl px-2 sm:px-3 py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-surface-hover transition-all text-text-primary">
                 <Globe size={16} className="text-primary-color shrink-0" />
                 <select 
                   value={language}
                   onChange={(e) => setLanguage(e.target.value)}
                   className="bg-transparent text-xs sm:text-sm font-black uppercase tracking-[0.1em] outline-none cursor-pointer appearance-none text-text-primary pr-1 max-w-[60px] sm:max-w-none"
                 >
                   <option value="en">EN</option>
                   <option value="hi">HI</option>
                   <option value="mr">MR</option>
                 </select>
               </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-panel-bg border border-panel-border backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg text-text-primary"
            >
              {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-500" />}
            </button>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:bg-red-500 hover:!text-white"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Row 2: Active Farm (collapsible on mobile) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="theme-badge border px-3 py-2 rounded-xl flex items-center gap-2 sm:gap-3 text-sm">
             <Tractor size={16} className="text-primary-color shrink-0" />
             <div className="flex flex-col min-w-0">
               <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-text-secondary font-bold">Active Farm</span>
               <span className="text-xs sm:text-sm font-black text-text-primary truncate">{activeFarmId ? `Farm [${activeFarmId.substring(0,6)}]` : 'No Farm'}</span>
             </div>
             <button onClick={() => navigate('/farms')} className="ml-1 text-[9px] sm:text-[10px] bg-primary-color px-2 py-1 rounded-md !text-white font-bold tracking-widest hover:bg-emerald-500 uppercase shrink-0">Change</button>
          </div>
        </div>
      </header>

      {/* ── Navigation ── */}
      <nav className="flex gap-1 sm:gap-2 p-1 sm:p-1.5 bg-surface-hover backdrop-blur-xl rounded-xl sm:rounded-2xl border border-panel-border mb-6 md:mb-10 shadow-xl overflow-x-auto mobile-nav-scroll">
        {tabs.map(({ path, label, icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-primary-color !text-white shadow-lg shadow-primary-color/20 scale-[1.02]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {icon}
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
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
