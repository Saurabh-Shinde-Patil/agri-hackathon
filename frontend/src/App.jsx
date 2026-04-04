import { useState, useEffect } from 'react'
import { Sun, Moon, Activity, Camera } from 'lucide-react'
import Home from './pages/Home'
import PredictionEngine from './pages/PredictionEngine'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agrishield-theme') || 'dark'
  })
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('agrishield-tab') || 'prediction'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('agrishield-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('agrishield-tab', activeTab)
  }, [activeTab])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const tabs = [
    { key: 'prediction', label: 'Prediction Engine', icon: <Activity size={16} />, description: 'Pest & Disease Forecasting' },
    { key: 'plantscan', label: 'PlantScan', icon: <Camera size={16} />, description: 'Image Detection' },
  ]

  return (
    <div className="max-w-[1200px] mx-auto p-8 w-full flex-1 flex flex-col">
      <header className="flex items-center justify-between mb-8 animate-fade-in-down">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-br from-primary-color to-accent-color bg-clip-text text-transparent mb-1">AgriShield AI</h1>
          <p className="text-text-secondary text-lg">Advanced Plant Protection & Disease Management System</p>
        </div>

        <button
          onClick={toggleTheme}
          className="relative w-14 h-14 rounded-2xl bg-panel-bg border border-panel-border backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg group"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={22} className="text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon size={22} className="text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>
      </header>

      {/* ═══ Tab Navigation ═══ */}
      <nav className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-10 shadow-xl w-fit mx-auto">
        {tabs.map(({ key, label, icon, description }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === key
                ? 'bg-primary-color text-white shadow-lg shadow-primary-color/20 scale-[1.02]'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {icon}
            <span>{label}</span>
            <span className={`text-[9px] uppercase tracking-widest font-medium hidden md:inline ${
              activeTab === key ? 'text-white/60' : 'text-text-secondary/50'
            }`}>
              {description}
            </span>
          </button>
        ))}
      </nav>

      {/* ═══ Page Content ═══ */}
      <div className="flex-1">
        {activeTab === 'prediction' ? (
          <PredictionEngine />
        ) : (
          <Home />
        )}
      </div>
    </div>
  )
}

export default App
