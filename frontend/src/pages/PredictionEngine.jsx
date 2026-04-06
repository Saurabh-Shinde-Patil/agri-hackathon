import { useState } from 'react'
import { 
  Thermometer, Droplets, CloudRain, Sprout, Layers, CalendarDays,
  MapPin, Activity, AlertTriangle, CheckCircle2, Shield, Bug, 
  Leaf, Zap, Wind, RefreshCw, ChevronDown, Info, Settings,
  TrendingUp, BarChart3, Target, Navigation, Globe, User, Cloud
} from 'lucide-react'
import api from '../config/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'

// ─── Crop Options ──────────────────────────────────────────────
const CROP_OPTIONS = [
  'tomato', 'rice', 'wheat', 'cotton', 'potato',
  'maize', 'sugarcane', 'soybean', 'chili', 'onion'
]

// ─── Risk Level Config ─────────────────────────────────────────
const RISK_CONFIG = {
  Low:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={28} />, label: 'Low Risk' },
  Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertTriangle size={28} />, label: 'Medium Risk' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <AlertTriangle size={28} />, label: 'High Risk' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <Zap size={28} />, label: 'Critical Risk' },
}

// ─── Source Badge Component ────────────────────────────────────
function SourceBadge({ source }) {
  if (source === 'weather_api') {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full">
        <Cloud size={9} /> Weather API
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-violet-500/15 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full">
      <User size={9} /> User Input
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

export default function PredictionEngine() {
  const { activeFarmId } = useAuth();
  const { language, t } = useLanguage();
  const { modeSelectionEnabled } = useSettings();
  
  // ── Form State ──
  const [temperature, setTemperature] = useState('')
  const [humidity, setHumidity] = useState('')
  const [rainfall, setRainfall] = useState('')
  const [mode, setMode] = useState('hybrid')
  const [aiProvider, setAiProvider] = useState('gemini')
  const [cropType, setCropType] = useState('tomato')
  const [soilMoisture, setSoilMoisture] = useState('')
  const [plantAge, setPlantAge] = useState('')
  const [location, setLocation] = useState('')

  // ── GPS State ──
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  // ── Result State ──
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  // ── GPS Location Handler ──
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    setIsGettingLocation(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Reverse geocode using OpenWeatherMap (free, no extra API key needed)
          const resp = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await resp.json()
          const city = data.city || data.locality || data.principalSubdivision || `${latitude.toFixed(2)},${longitude.toFixed(2)}`
          setLocation(city)
        } catch {
          // Fallback: just use coords as text
          setLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`)
        }
        setIsGettingLocation(false)
      },
      (err) => {
        setIsGettingLocation(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location permission denied. Please allow location access or type a city name manually.')
            break
          case err.POSITION_UNAVAILABLE:
            setGpsError('Location information unavailable. Try typing a city name instead.')
            break
          case err.TIMEOUT:
            setGpsError('Location request timed out. Try again or type a city name.')
            break
          default:
            setGpsError('Could not get your location. Please type a city name manually.')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setIsLoading(true)
    setLoadingStep(0)

    const t1 = setTimeout(() => setLoadingStep(1), 600)
    const t2 = setTimeout(() => setLoadingStep(2), 1400)
    const t3 = setTimeout(() => setLoadingStep(3), 2200)

    try {
      const payload = {
        farm_id: activeFarmId,
        crop_type: cropType,
        soil_moisture: parseFloat(soilMoisture),
        plant_age_days: parseInt(plantAge),
        mode: mode,
        ai_provider: aiProvider,
        location: location.trim() || null,
        // Only send weather values if user provided them
        temperature: temperature !== '' ? parseFloat(temperature) : null,
        humidity: humidity !== '' ? parseFloat(humidity) : null,
        rainfall: rainfall !== '' ? parseFloat(rainfall) : null,
        language: language
      }

      const response = await api.post('/predict', payload)
      setResult(response.data)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to connect to prediction service. Make sure backend is running.'
      setError(msg)
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setLoadingStep(0)
  }

  // Required: crop, soil, age. Weather fields are optional IF location is provided.
  const hasRequiredFields = cropType && soilMoisture && plantAge
  const hasWeatherInputs = temperature && humidity && rainfall
  const isFormValid = hasRequiredFields && (hasWeatherInputs || location)

  // ──────────────────────────────────────────────────
  //  LOADING STATE
  // ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center animate-fade-in min-h-[600px] w-full max-w-4xl mx-auto shadow-2xl bg-gradient-to-br from-primary-color/5 to-transparent">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-primary-color animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity size={48} className="text-primary-color animate-pulse" />
          </div>
        </div>

        <h2 className="text-4xl font-black text-white mb-2">Analyzing Risk</h2>
        <div className="flex gap-1 mb-8">
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce"></div>
        </div>

        <div className="w-full max-w-md space-y-4">
          {[
            { step: 1, icon: <BarChart3 size={18} />, text: mode === 'api' ? 'Connecting to Gemini AI...' : 'Processing environmental data...' },
            { step: 2, icon: <Bug size={18} />, text: 'Running pest risk analysis...' },
            { step: 3, icon: <Shield size={18} />, text: 'Generating management plan...' },
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
          {modeSelectionEnabled && (
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
          )}
          {modeSelectionEnabled && (mode === 'api' || mode === 'hybrid') && (
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
              onClick={handleSubmit}
              disabled={!isFormValid}
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

        {/* ═══ Row 1: Risk Level + Probability ═══ */}
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

            {/* Weather error warning */}
            {result.weather_error && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{result.weather_error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Row 2: Ranked Pest Threats ═══ */}
        {result.pest_threats && result.pest_threats.length > 0 && (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-red-400 mb-6 uppercase tracking-widest font-black text-xs">
              <Bug size={20} />
              {t('predict.ranked_threats') || 'Ranked Disease & Pest Threats'}
            </div>
            <div className="flex flex-col">
              {result.pest_threats.map((threat, idx) => (
                <RankedThreatCard key={idx} threat={threat} color={riskCfg.color} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ Row 3: Analysis Reason ═══ */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-primary-color mb-6 uppercase tracking-widest font-black text-xs">
            <Info size={18} />
            {t('predict.reason') || 'Analysis Reasoning'}
          </div>
          <p className="text-lg text-text-secondary leading-relaxed font-light italic border-l-4 border-primary-color/30 pl-6">
            "{result.reason || 'No detailed reason available.'}"
          </p>
        </div>

        {/* ═══ Row 4: Recommendations ═══ */}
        {result.recommendations && (
          <div className="bg-card-bg p-10 rounded-[40px] shadow-2xl shadow-black/20 border border-card-border">
            <div className="flex items-center gap-3 text-[#059669] font-black mb-10 pb-6 border-b border-card-border">
              <Shield size={28} />
              <h3 className="text-3xl tracking-tight">{t('predict.ipm_plan') || 'Integrated Pest Management Plan'}</h3>
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

        {/* ═══ Row 5: Data Sources — shows which values came from user vs API ═══ */}
        {result.inputs && result.data_sources && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-text-secondary mb-4 uppercase tracking-widest font-black text-[10px]">
              <BarChart3 size={14} />
              Input Parameters & Data Sources
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Temp', key: 'temperature', value: `${result.inputs.temperature}°C`, icon: <Thermometer size={14} /> },
                { label: 'Humidity', key: 'humidity', value: `${result.inputs.humidity}%`, icon: <Droplets size={14} /> },
                { label: 'Rain', key: 'rainfall', value: `${result.inputs.rainfall}mm`, icon: <CloudRain size={14} /> },
                { label: 'Crop', key: 'crop_type', value: result.inputs.crop_type, icon: <Sprout size={14} /> },
                { label: 'Soil', key: 'soil_moisture', value: `${result.inputs.soil_moisture}%`, icon: <Layers size={14} /> },
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

        {/* ═══ Weather Data Fetched (if any) ═══ */}
        {result.weather_data_fetched && (
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-3">
              <Globe size={14} /> Live Weather Data from {result.weather_data_fetched.location_name}, {result.weather_data_fetched.country}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              <span>🌡️ {result.weather_data_fetched.temperature}°C</span>
              <span>💧 {result.weather_data_fetched.humidity}%</span>
              <span>🌧️ {result.weather_data_fetched.rainfall}mm</span>
              <span>💨 {result.weather_data_fetched.wind_speed} m/s</span>
              <span>☁️ {result.weather_data_fetched.description}</span>
            </div>
          </div>
        )}

        {/* Bottom: New Prediction */}
        <div className="flex justify-center pt-6">
          <button onClick={handleReset}
            className="px-16 py-5 bg-panel-bg border border-panel-border hover:opacity-80 rounded-3xl font-black text-text-primary transition-all hover:scale-105"
          >
            Run Another Prediction
          </button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────
  //  INPUT FORM STATE (Default)
  // ──────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-color/10 text-primary-color px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Activity size={14} />
          AI-Powered Forecasting
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
          Pest & Disease <span className="bg-gradient-to-r from-primary-color to-accent-color bg-clip-text text-transparent">Prediction</span>
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Enter your crop's environmental conditions to get AI-powered pest and disease risk forecasts with actionable management plans.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ═══ Mode Selector ═══ */}
        {modeSelectionEnabled && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <label className="block text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
              <Settings size={14} /> Prediction Mode
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-panel-border max-w-md">
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
          </div>
        )}

        {/* ═══ Location Section (Always visible) ═══ */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
            <MapPin size={14} className="text-pink-400" /> Location
            <span className="text-[8px] text-cyan-400 normal-case tracking-normal font-medium ml-1">
              — used to auto-fetch temperature, humidity & rainfall if left empty
            </span>
          </label>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mumbai, Pune, Delhi"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-primary-color/30 transition-all max-w-md"
            />
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 px-5 py-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-sm transition-all hover:bg-cyan-500/25 hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {isGettingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Locating...
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  Get Live Location
                </>
              )}
            </button>
          </div>
          {gpsError && (
            <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {gpsError}
            </p>
          )}
          {location && !gpsError && (
            <p className="text-primary-color text-xs mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Location set: {location}
            </p>
          )}
        </div>        

        {/* ═══ Required Inputs Section ═══ */}
        <div>
          {modeSelectionEnabled && (mode === 'api' || mode === 'hybrid') && (
            <div className="mb-8 animate-fade-in">
              <label className="block text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                 AI Provider
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
            <User size={12} /> Required Inputs <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Crop Type */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 group hover:border-primary-color/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <Sprout size={14} className="text-green-400" /> Crop Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select value={cropType} onChange={(e) => setCropType(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium appearance-none focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-primary-color/30 transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-[#1a2332] text-white/40">Select crop...</option>
                  {CROP_OPTIONS.map(crop => (
                    <option key={crop} value={crop} className="bg-[#1a2332] text-white capitalize">{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 group hover:border-primary-color/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <Layers size={14} className="text-amber-400" /> Soil Moisture (%) <span className="text-red-400">*</span>
              </label>
              <input type="number" step="0.1" min="0" max="100" value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)} placeholder="e.g. 65" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-primary-color/30 transition-all"
              />
            </div>

            {/* Plant Age */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 group hover:border-primary-color/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <CalendarDays size={14} className="text-violet-400" /> Plant Age (Days) <span className="text-red-400">*</span>
              </label>
              <input type="number" min="1" value={plantAge}
                onChange={(e) => setPlantAge(e.target.value)} placeholder="e.g. 30" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-primary-color/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ═══ Optional Weather Inputs ═══ */}
        <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
            <Cloud size={12} /> Weather Inputs
            <span className="text-cyan-400 normal-case tracking-normal font-medium text-[9px]">
              — optional, auto-fetched from weather API if location is provided
            </span>
          </p>
          <p className="text-text-secondary text-[10px] mb-4 opacity-50">Leave empty to auto-fetch from OpenWeatherMap using your location</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 border-dashed group hover:border-cyan-500/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <Thermometer size={14} className="text-red-400" /> Temperature (°C)
                <span className="text-[7px] text-cyan-400 normal-case tracking-normal">auto-fetchable</span>
              </label>
              <input type="number" step="0.1" value={temperature}
                onChange={(e) => setTemperature(e.target.value)} placeholder="Leave empty to auto-fetch"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            {/* Humidity */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 border-dashed group hover:border-cyan-500/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <Droplets size={14} className="text-blue-400" /> Humidity (%)
                <span className="text-[7px] text-cyan-400 normal-case tracking-normal">auto-fetchable</span>
              </label>
              <input type="number" step="0.1" min="0" max="100" value={humidity}
                onChange={(e) => setHumidity(e.target.value)} placeholder="Leave empty to auto-fetch"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            {/* Rainfall */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 border-dashed group hover:border-cyan-500/30 transition-all">
              <label className="flex items-center gap-2 text-[10px] font-black text-text-secondary mb-3 uppercase tracking-[0.2em]">
                <CloudRain size={14} className="text-cyan-400" /> Rainfall (mm)
                <span className="text-[7px] text-cyan-400 normal-case tracking-normal">auto-fetchable</span>
              </label>
              <input type="number" step="0.1" min="0" value={rainfall}
                onChange={(e) => setRainfall(e.target.value)} placeholder="Leave empty to auto-fetch"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ═══ Error Display ═══ */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3 animate-fade-in">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-bold text-sm">Prediction Error</p>
              <p className="text-red-300/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ═══ Validation Hint ═══ */}
        {!isFormValid && hasRequiredFields && !hasWeatherInputs && !location && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
            <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              Either provide <strong>Temperature, Humidity & Rainfall</strong> manually, or enter a <strong>Location</strong> to auto-fetch them from the weather API.
            </p>
          </div>
        )}

        {/* ═══ Submit Button ═══ */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full py-5 bg-[#059669] text-white rounded-2xl font-black text-xl hover:bg-[#047857] shadow-xl shadow-[#059669]/20 transition-all flex items-center justify-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] hover:scale-[1.01]"
        >
          <TrendingUp size={28} className="stroke-[2.5]" />
          {isLoading ? 'Analyzing...' : 'Predict Pest & Disease Risk'}
        </button>
      </form>
    </div>
  )
}
