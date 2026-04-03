import Home from './pages/Home'

function App() {
  return (
    <div className="max-w-[1200px] mx-auto p-8 w-full flex-1 flex flex-col">
      <header className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-5xl font-bold bg-gradient-to-br from-primary-color to-accent-color bg-clip-text text-transparent mb-2">PlantScan AI</h1>
        <p className="text-text-secondary text-lg">Advanced Plant Protection & Disease Detection System</p>
      </header>

      {/* Pages and Routing can go here in the future */}
      <Home />
      
    </div>
  )
}

export default App
