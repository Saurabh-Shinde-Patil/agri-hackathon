import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import Home from './pages/Home'

function App() {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to dark
    return localStorage.getItem('agrishield-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('agrishield-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="max-w-[1200px] mx-auto p-8 w-full flex-1 flex flex-col">
      <header className="flex items-center justify-between mb-12 animate-fade-in-down">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-br from-primary-color to-accent-color bg-clip-text text-transparent mb-1">PlantScan AI</h1>
          <p className="text-text-secondary text-lg">Advanced Plant Protection & Disease Detection System</p>
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

      <Home />
    </div>
  )
}

export default App
