import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  Thermometer, Droplets, CloudRain, Sprout, Layers, CalendarDays,
  Target, Activity, AlertTriangle, CheckCircle2, Shield, Bug, 
  Leaf, Zap, Sun, RefreshCw, Info, Settings, TrendingUp, BarChart3, 
  Globe, User, Cloud, Server, ChevronDown, Cpu, Wifi, WifiOff
} from 'lucide-react'
import api from '../config/api'

// ─── Risk Level Config ─────────────────────────────────────────
const RISK_CONFIG = {
  Low:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={28} />, label: 'Low Risk' },
  Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertTriangle size={28} />, label: 'Medium Risk' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <AlertTriangle size={28} />, label: 'High Risk' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <Zap size={28} />, label: 'Critical Risk' },
}

// ─── Source Badge ───
function SourceBadge({ source }) {
  if (source === 'sensor') {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-[#059669]/15 text-[#059669] border border-[#059669]/25 px-2 py-0.5 rounded-full mt-1">
        <Server size={9} /> SENSOR
      </span>
    )
  }
  if (source === 'weather_api') {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full mt-1">
        <Cloud size={9} /> WEATHER API
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full mt-1">
      <User size={9} /> MANUAL
    </span>
  )
}

function RankedThreatCard({ threat, color }) {
  const [expanded, setExpanded] = useState(false)
  
  const isObj = typeof threat === 'object'
  const name = isObj ? threat.name : threat
  const prob = isObj ? threat.probability : 0
  const advisory = isObj ? threat.advisory : null

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all mb-4">
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-6 w-full">
          {/* Progress Circle & Text */}
          <div className="flex items-center gap-4 min-w-[200px]">
             <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0" style={{ backgroundColor: `${color}20`, color: color }}>
               {prob}%
             </div>
             <div>
               <h4 className="text-white font-bold text-lg">{name}</h4>
               <p className="text-text-secondary text-xs mt-1">Probability of occurrence</p>
             </div>
          </div>
          
          {/* Progress Bar (Hidden on very small screens) */}
          <div className="hidden md:block flex-1 max-w-[200px] mr-auto">
             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${prob}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}80` }}
                ></div>
             </div>
          </div>
        </div>
        
        <button className="hidden sm:block px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 ml-4" style={{ backgroundColor: `${color}20`, color: color }}>
          {expanded ? 'Hide Solution' : 'See Solution'}
        </button>
      </div>

      {expanded && advisory && (
        <div className="p-6 border-t border-white/10 bg-black/20 space-y-6 animate-fade-in">
          <div className="flex gap-4">
            <div className="mt-1"><Zap size={20} className="text-red-400 shrink-0" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Immediate Action / Chemical</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.immediate || advisory.chemical || "Consult specialist."}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Leaf size={20} className="text-green-400 shrink-0" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Organic Control</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.organic || "No specific organic control."}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Shield size={20} className="text-blue-400 shrink-0" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Preventive Steps</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.preventive || "Condition requires standard protocols."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



export default function IoTDashboard() { 
const { activeFarmId } = useAuth(); 
  const [telemetry, setTelemetry] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  // Prediction State
  const [mode, setMode] = useState('hybrid')
  const [aiProvider, setAiProvider] = useState('gemini')
  const [cropType, setCropType] = useState('tomato')
  const [plantAge, setPlantAge] = useState('30')
  const [result, setResult] = useState(null)
  
  // Predict Status
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictError, setPredictError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const fetchTelemetry = async () => {
    setIsFetching(true)
    // We don't reset fetchError here to avoid UI flicker if previously failed
    try {
      const response = await api.get(`/iot-data/latest?farm_id=${activeFarmId}`)
      setTelemetry(response.data)
      setFetchError(null) // Clear error on success
    } catch (err) {
      console.error(err)
      setFetchError('Hardware unreachable. Displaying last known data.')
    } finally {
      setIsFetching(false)
    }
  }

  // Poll data every 10 seconds
  useEffect(() => {
    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 10000)
    return () => clearInterval(interval)
  }, [])

  const handlePredict = async (e) => {
    e?.preventDefault()
    setPredictError(null)
    setResult(null)
    setIsPredicting(true)
    setLoadingStep(0)

    const t1 = setTimeout(() => setLoadingStep(1), 600)
    const t2 = setTimeout(() => setLoadingStep(2), 1400)
    const t3 = setTimeout(() => setLoadingStep(3), 2200)

    try {
      const payload = {
        crop_type: cropType,
        plant_age_days: parseInt(plantAge),
        soil_moisture: telemetry?.soil_moisture ?? 50,
        temperature: telemetry?.temperature ?? null,
        humidity: telemetry?.humidity ?? null,
        rainfall: telemetry?.rain_status ? 10.0 : 0.0,
        rain_status: telemetry?.rain_status ?? 0,
        light_intensity: telemetry?.light_intensity ?? null,
        mode: mode,
        ai_provider: aiProvider,
        location: null, // Since we rely on sensors
        data_sources: {
          temperature: telemetry && telemetry.temperature !== undefined ? 'sensor' : 'user',
          humidity: telemetry && telemetry.humidity !== undefined ? 'sensor' : 'user',
          soil_moisture: telemetry && telemetry.soil_moisture !== undefined ? 'sensor' : 'user',
          rainfall: telemetry && telemetry.rain_status !== undefined ? 'sensor' : 'user',
          crop_type: 'user',
          plant_age_days: 'user'
        }
      }

      const response = await api.post('/predict', { ...payload, farm_id: activeFarmId })
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setPredictError(err.response?.data?.error || err.response?.data?.detail || 'Failed prediction')
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      setIsPredicting(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setPredictError(null)
    setLoadingStep(0)
  }

  // ──────────────────────────────────────────────────
  //  LOADING STATE
  // ──────────────────────────────────────────────────
  if (isPredicting) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center animate-fade-in min-h-[600px] w-full max-w-4xl mx-auto shadow-2xl bg-gradient-to-br from-primary-color/5 to-transparent">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-primary-color animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity size={48} className="text-primary-color animate-pulse" />
          </div>
        </div>

        <h2 className="text-4xl font-black text-white mb-2">Analyzing Sensor Data</h2>
        <div className="flex gap-1 mb-8">
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce"></div>
        </div>

        <div className="w-full max-w-md space-y-4">
          {[
            { step: 1, icon: <Server size={18} />, text: 'Reading IoT Hardware metrics...' },
            { step: 2, icon: <Bug size={18} />, text: 'Running local ML algorithms...' },
            { step: 3, icon: <Shield size={18} />, text: 'Generating predictive management plan...' },
          ].map(({ step, icon, text }) => (
            <div key={step} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${loadingStep >= step ? 'bg-primary-color/10 translate-x-2 opacity-100' : 'opacity-40 translate-x-0'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loadingStep >= step ? 'bg-primary-color text-white' : 'bg-white/10 text-white/50'}`}>
                {loadingStep >= step ? <CheckCircle2 size={18} /> : icon}
              </div>
              <span className={`font-semibold ${loadingStep >= step ? 'text-white' : 'text-text-secondary'}`}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────
  //  RESULT STATE
  // ──────────────────────────────────────────────────
  if (result) {
    const riskCfg = RISK_CONFIG[result.risk_level] || RISK_CONFIG.Medium
    const probabilityPercent = Math.round((result.probability || 0) * 100)

    return (
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-32 animate-fade-in">
        
        {/* Mode Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-primary-color" />
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Prediction Mode</span>
            </div>
            <div className="flex gap-1 p-1 bg-black/30 rounded-xl border border-panel-border">
              {['model', 'api', 'hybrid'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-1.5 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === m ? 'bg-primary-color text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {(mode === 'api' || mode === 'hybrid') && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-primary-color" />
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">AI Provider</span>
              </div>
              <div className="flex gap-1 p-1 bg-black/30 rounded-xl border border-panel-border">
                {['gemini', 'grok'].map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setAiProvider(provider)}
                    className={`py-1.5 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${aiProvider === provider ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-text-secondary hover:text-white'}`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePredict}
              disabled={!telemetry}
              className="flex items-center gap-2 px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#059669]/20 disabled:opacity-50"
            >
              <RefreshCw size={16} /> Re-Predict
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm transition-all hover:bg-white/10"
            >
              <Target size={16} /> New Prediction
            </button>
          </div>
        </div>

        {/* ═══ Row 1: Hardware IoT Alerts ═══ */}
        {result.iot_alerts && result.iot_alerts.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-red-500/30 bg-red-500/10 mb-2">
            <h4 className="text-red-400 font-black tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
              <Zap size={20} /> IoT Hardware Threshold Alerts
            </h4>
            <div className="flex flex-col gap-3">
                {result.iot_alerts.map((alert, i) => (
                  <div key={i} className="text-md text-red-200 flex items-center gap-2 font-medium">
                      <AlertTriangle size={16} className="text-red-500" /> {alert}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ═══ Row 2: Risk Level + Probability ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Risk Level Card */}
          <div 
            className="glass-panel p-8 rounded-3xl border-2 relative overflow-hidden group"
            style={{ borderColor: `${riskCfg.color}40`, background: riskCfg.bg }}
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 leading-none" style={{ color: riskCfg.color }}>
                Risk Assessment
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${riskCfg.color}20`, color: riskCfg.color }}
                >
                  {riskCfg.icon}
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tight" style={{ color: riskCfg.color }}>
                    {result.risk_level}
                  </h1>
                  <p className="text-text-secondary text-sm font-medium mt-1">
                    Pest & Disease Risk Level
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.04] group-hover:rotate-12 transition-transform duration-700">
              <Shield size={200} />
            </div>
          </div>

          {/* Probability + Source Card */}
          <div className="flex flex-col gap-5">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 flex gap-8 items-center flex-1">
              <div className="flex-1">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">Risk Probability</p>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full shadow-lg transition-all duration-1000"
                    style={{ width: `${probabilityPercent}%`, backgroundColor: riskCfg.color, boxShadow: `0 0 15px ${riskCfg.color}80` }}
                  ></div>
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: riskCfg.color }}>
                {probabilityPercent}%
              </div>
            </div>

            {/* Source & Mode Tags */}
            <div className="flex flex-wrap gap-3 text-[10px] font-black tracking-widest uppercase px-1">
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-text-secondary">
                Source: {result.source === 'hybrid' ? `Hybrid (${aiProvider})` : result.source || result.mode}
              </span>
              <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-text-secondary">
                Mode: {result.mode}
              </span>
              {result.winner && (
                <span className="bg-primary-color/10 border border-primary-color/20 px-3 py-1.5 rounded-full text-primary-color">
                  Winner: {result.winner === 'cloud_api' ? aiProvider : result.winner}
                </span>
              )}
            </div>

            {/* Hybrid confidence comparison */}
            {result.ml_confidence !== undefined && result.gemini_confidence !== undefined && (
              <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-white/5">
                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-3">Confidence Comparison</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-text-secondary w-20">ML Model</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.round(result.ml_confidence * 100)}%` }}></div>
                    </div>
                    <span className={`text-sm font-black ${result.winner === 'ml_model' ? 'text-blue-400' : 'text-text-secondary'}`}>
                      {Math.round(result.ml_confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-text-secondary w-20 capitalize">{aiProvider} AI</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full rounded-full bg-purple-500 transition-all duration-1000" style={{ width: `${Math.round(result.gemini_confidence * 100)}%` }}></div>
                    </div>
                    <span className={`text-sm font-black ${result.winner === 'cloud_api' ? 'text-purple-400' : 'text-text-secondary'}`}>
                      {Math.round(result.gemini_confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Row 3: Ranked Pest Threats ═══ */}
        {result.pest_threats && result.pest_threats.length > 0 && (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-red-400 mb-6 uppercase tracking-widest font-black text-xs">
              <Bug size={20} />
              Ranked Disease & Pest Threats
            </div>
            <div className="flex flex-col">
              {result.pest_threats.map((threat, idx) => (
                <RankedThreatCard key={idx} threat={threat} color={riskCfg.color} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ Row 4: Recommendations ═══ */}
        {result.recommendations && (
          <div className="bg-card-bg p-10 rounded-[40px] shadow-2xl shadow-black/20 border border-card-border">
            <div className="flex items-center gap-3 text-[#059669] font-black mb-10 pb-6 border-b border-card-border">
              <Shield size={28} />
              <h3 className="text-3xl tracking-tight">Integrated Pest Management Plan</h3>
            </div>
            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20">
                  <Zap size={22} />
                </div>
                <div className="pt-1">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Immediate Action</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">
                    {result.recommendations.immediate || 'No immediate action needed.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#059669]/20">
                  <Leaf size={22} />
                </div>
                <div className="pt-1">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Organic Control</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">
                    {result.recommendations.organic || 'Standard organic practices recommended.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                  <Shield size={22} />
                </div>
                <div className="pt-1">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Prevention Strategy</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">
                    {result.recommendations.preventive || 'Maintain standard preventive practices.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Row 5: Data Sources ═══ */}
        {result.inputs && result.data_sources && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-text-secondary mb-4 uppercase tracking-widest font-black text-[10px]">
              <BarChart3 size={14} />
              Input Parameters & Data Sources
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Temp', key: 'temperature', value: result.inputs.temperature ? `${result.inputs.temperature}°C` : 'N/A', icon: <Thermometer size={14} /> },
                { label: 'Humidity', key: 'humidity', value: result.inputs.humidity ? `${result.inputs.humidity}%` : 'N/A', icon: <Droplets size={14} /> },
                { label: 'Soil', key: 'soil_moisture', value: result.inputs.soil_moisture ? `${result.inputs.soil_moisture}%` : 'N/A', icon: <Layers size={14} /> },
                { label: 'Light', key: 'light_intensity', value: result.inputs.light_intensity !== undefined ? `${result.inputs.light_intensity}%` : 'N/A', icon: <Sun size={14} /> },
                { label: 'Rain', key: 'rainfall', value: result.inputs.rainfall !== undefined ? `${result.inputs.rainfall}mm` : 'N/A', icon: <CloudRain size={14} /> },
                { label: 'Crop', key: 'crop_type', value: result.inputs.crop_type, icon: <Sprout size={14} /> },
                { label: 'Age', key: 'plant_age_days', value: `${result.inputs.plant_age_days}d`, icon: <CalendarDays size={14} /> },
              ].map(({ label, key, value, icon }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <div className="flex items-center justify-center gap-1 text-text-secondary text-[9px] font-black uppercase tracking-widest mb-1">
                    {icon} {label}
                  </div>
                  <p className="text-white font-bold text-sm capitalize mb-1.5">{value}</p>
                  <SourceBadge source={result.data_sources[key]} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────────────
  //  INPUT FORM STATE (Default)
  // ──────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto pb-32 animate-fade-in flex flex-col gap-10">
      
      {/* ── Header ── */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 bg-[#059669]/10 text-[#059669] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Activity size={14} className="animate-pulse" /> Live IoT Station
        </div>
        <h2 className="text-4xl font-black text-white mb-2">Hardware Telemetry</h2>
        <p className="text-text-secondary text-sm">Real-time agricultural monitoring via ESP32 sensors</p>
      </div>

      {/* ── Telemetry Grid (matches Dashboard style) ── */}
      <div className="glass-panel p-6 md:p-8 rounded-[28px] border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Cpu size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">IoT Sensor Station</h3>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">ESP32 Live Telemetry</p>
            </div>
          </div>
        <div className="flex items-center gap-3">
            {(() => {
              // Check if ESP32 is truly online: data exists, no fetch error, and data is fresh (< 60s old)
              let isOnline = !!telemetry && !fetchError
              if (isOnline && telemetry?.timestamp) {
                const lastUpdate = new Date(telemetry.timestamp.replace(' ', 'T') + 'Z')
                const ageSeconds = (Date.now() - lastUpdate.getTime()) / 1000
                if (ageSeconds > 60) isOnline = false
              }
              return isOnline ? (
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <Wifi size={12} /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                  <WifiOff size={12} /> Offline
                </span>
              )
            })()}
            <button onClick={fetchTelemetry} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <RefreshCw size={14} className={`text-text-secondary ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {fetchError && !telemetry ? (
          <div className="bg-red-500/10 text-red-400 p-5 rounded-2xl flex items-center gap-3 font-semibold border border-red-500/20 text-sm">
            <AlertTriangle size={18} /> {fetchError}
          </div>
        ) : !telemetry ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-32 border border-white/5"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: <Thermometer size={22} />, label: 'Temperature', value: telemetry.temperature, unit: '°C', color: '#ef4444' },
                { icon: <Droplets size={22} />, label: 'Humidity', value: telemetry.humidity, unit: '%', color: '#3b82f6' },
                { 
                  icon: <Layers size={22} />, 
                  label: 'Soil Moisture', 
                  value: telemetry.soil_moisture !== null && telemetry.soil_moisture !== undefined 
                    ? telemetry.soil_moisture 
                    : 'N/A', 
                  unit: '%', 
                  color: '#f59e0b' 
                },
                { 
                  icon: <Sun size={22} />, 
                  label: 'Light (Brightness)', 
                  value: telemetry.light_intensity !== null && telemetry.light_intensity !== undefined ? telemetry.light_intensity : 'N/A', 
                  unit: telemetry.light_intensity !== null && telemetry.light_intensity !== undefined ? 'Lux' : '', 
                  color: '#eab308'
                },
                { icon: <CloudRain size={22} />, label: 'Rain Status', value: telemetry.rain_status ? 'YES' : 'NO', unit: '', color: telemetry.rain_status ? '#06b6d4' : '#6b7280' },
              ].map(({ icon, label, value, unit, color, subLabel }) => (
                <div key={label} className="relative group bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)` }}></div>
                  <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15`, color }}>
                    {icon}
                  </div>
                  <p className="relative z-10 text-[9px] uppercase tracking-[0.2em] text-text-secondary font-black mb-1.5">{label} {subLabel && `(${subLabel})`}</p>
                  <p className="relative z-10 text-2xl font-black text-white">
                    {value !== null && value !== undefined ? value : '—'}
                    {unit && value !== null && value !== undefined && <span className="text-sm font-medium text-text-secondary ml-0.5">{unit}</span>}
                  </p>
                  <span className="relative z-10 inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                    <Server size={8} /> SENSOR
                  </span>
                </div>
              ))}
            </div>
            {telemetry.timestamp && (
              <p className="text-[10px] text-text-secondary text-right mt-3 font-medium flex items-center justify-end gap-1.5 uppercase tracking-widest">
                <RefreshCw size={10} className={isFetching ? 'animate-spin' : ''} />
                Last updated: {(() => {
                  const d = new Date(telemetry.timestamp.replace(' ', 'T') + 'Z');
                  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
                  return `${dateStr} / ${timeStr}`;
                })()}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Predict Form ── */}
      <form onSubmit={handlePredict} className="space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-white/10">
          <label className="block text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
            <Settings size={14} /> Prediction Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-panel-border max-w-md mb-8">
            {[
              { key: 'model', label: 'ML Model', desc: 'Random Forest' },
              { key: 'api', label: 'Gemini AI', desc: 'AI Prediction' },
              { key: 'hybrid', label: 'Hybrid', desc: 'ML + Gemini' },
            ].map(({ key, label, desc }) => (
              <button key={key} type="button" onClick={() => setMode(key)}
                className={`py-3 px-3 rounded-lg transition-all text-center ${mode === key
                  ? 'bg-primary-color text-white shadow-lg'
                  : 'text-text-secondary hover:text-white'
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-widest">{label}</span>
                <span className="block text-[8px] opacity-60 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>

          {(mode === 'api' || mode === 'hybrid') && (
            <div className="mb-8 animate-fade-in">
              <label className="block text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Settings size={14} /> AI Provider
              </label>
              <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-panel-border max-w-[200px]">
                {['gemini', 'grok'].map(provider => (
                  <button key={provider} type="button" onClick={() => setAiProvider(provider)}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${aiProvider === provider ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-text-secondary hover:text-white'}`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-widest">{provider}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <User size={12} /> Required Manual Inputs <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <Sprout size={14} className="text-green-400" /> Crop Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select value={cropType} onChange={(e) => setCropType(e.target.value)} required
                  className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium appearance-none outline-none focus:border-primary-color transition-all cursor-pointer capitalize"
                >
                  <option value="" disabled className="text-white/40">Select crop...</option>
                  {['tomato', 'rice', 'wheat', 'cotton', 'potato'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <CalendarDays size={14} className="text-violet-400" /> Plant Age (Days) <span className="text-red-400">*</span>
              </label>
              <input type="number" min="1" value={plantAge} onChange={(e) => setPlantAge(e.target.value)} required
                className="w-full bg-[#1a2332] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium outline-none focus:border-primary-color transition-all"
              />
            </div>
          </div>
        </div>

        {predictError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3 animate-fade-in">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-bold text-sm">Prediction Error</p>
              <p className="text-red-300/80 text-sm mt-1">{predictError}</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={!telemetry || isPredicting}
          className="w-full py-5 bg-[#059669] text-white rounded-2xl font-black text-xl hover:bg-[#047857] shadow-xl shadow-[#059669]/20 transition-all flex items-center justify-center gap-4 disabled:opacity-40 hover:scale-[1.01]"
        >
          <TrendingUp size={28} className="stroke-[2.5]" />
          {isPredicting ? 'Analyzing Telemetry...' : 'Run Analysis on Live Data'}
        </button>
      </form>
    </div>
  )
}
