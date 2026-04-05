import { useState, useEffect } from 'react'
import { 
  Thermometer, Droplets, CloudRain, Sprout, Layers, CalendarDays,
  Target, Activity, AlertTriangle, CheckCircle2, Shield, Bug, 
  Leaf, Zap, Sun, RefreshCw, Info, Settings, TrendingUp, BarChart3, 
  Globe, User, Cloud, Server, ChevronDown
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

export default function IoTDashboard() {
  const [telemetry, setTelemetry] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  // Prediction State
  const [mode, setMode] = useState('hybrid')
  const [cropType, setCropType] = useState('tomato')
  const [plantAge, setPlantAge] = useState('30')
  const [result, setResult] = useState(null)
  
  // Predict Status
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictError, setPredictError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const fetchTelemetry = async () => {
    setIsFetching(true)
    setFetchError(null)
    try {
      const response = await api.get('/iot-data/latest')
      setTelemetry(response.data)
    } catch (err) {
      console.error(err)
      setFetchError('Failed to fetch latest IoT data. Is the hardware connected?')
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
        location: null, // Since we rely on sensors
        data_sources: {
          temperature: telemetry?.temperature !== null ? 'sensor' : 'user',
          humidity: telemetry?.humidity !== null ? 'sensor' : 'user',
          soil_moisture: telemetry?.soil_moisture !== null ? 'sensor' : 'user',
          rainfall: telemetry?.rain_status !== null ? 'sensor' : 'user',
          crop_type: 'user',
          plant_age_days: 'user'
        }
      }

      const response = await api.post('/predict', payload)
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
                Mode: {result.mode}
              </span>
              {result.winner && (
                <span className="bg-primary-color/10 border border-primary-color/20 px-3 py-1.5 rounded-full text-primary-color">
                  Winner: {result.winner}
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
                    <span className="text-[10px] font-bold text-text-secondary w-20">Gemini AI</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full rounded-full bg-purple-500 transition-all duration-1000" style={{ width: `${Math.round(result.gemini_confidence * 100)}%` }}></div>
                    </div>
                    <span className={`text-sm font-black ${result.winner === 'gemini_api' ? 'text-purple-400' : 'text-text-secondary'}`}>
                      {Math.round(result.gemini_confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Row 3: Pest Threats ═══ */}
        {result.pest_threats && result.pest_threats.length > 0 && (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-red-400 mb-6 uppercase tracking-widest font-black text-xs">
              <Bug size={20} />
              Identified Pest & Disease Threats
            </div>
            <div className="flex flex-wrap gap-3">
              {result.pest_threats.map((threat, idx) => (
                <span key={idx}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all hover:scale-105 hover:translate-y-[-2px]"
                  style={{ borderColor: `${riskCfg.color}40`, background: `${riskCfg.color}10`, color: riskCfg.color }}
                >
                  <Bug size={14} className="inline mr-2 opacity-60" />
                  {threat}
                </span>
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

      {/* ── Telemetry Grid ── */}
      <div className="glass-panel p-8 rounded-[32px] border border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Server className="text-cyan-400" />
            <h3 className="text-lg font-bold">Latest Sensor Readings</h3>
            {isFetching && <RefreshCw size={14} className="animate-spin text-text-secondary ml-2" />}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-black tracking-widest text-text-secondary">Last Updated</p>
            <p className="text-white text-sm font-medium">
              {telemetry ? new Date(telemetry.timestamp).toLocaleString() : 'Loading...'}
            </p>
          </div>
        </div>

        {fetchError ? (
          <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-4 font-semibold border border-red-500/20">
            <AlertTriangle /> {fetchError}
          </div>
        ) : !telemetry ? (
          <div className="animate-pulse flex gap-4 h-32 w-full bg-white/5 rounded-2xl"></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col text-center">
              <Thermometer className="mx-auto mb-2 text-red-400" size={24} />
              <p className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Temperature</p>
              <p className="text-2xl font-black">{telemetry.temperature}°C</p>
              <SourceBadge source="sensor" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col text-center">
              <Droplets className="mx-auto mb-2 text-blue-400" size={24} />
              <p className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Humidity</p>
              <p className="text-2xl font-black">{telemetry.humidity}%</p>
              <SourceBadge source="sensor" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col text-center">
              <Layers className="mx-auto mb-2 text-amber-500" size={24} />
              <p className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Soil Moisture</p>
              <p className="text-2xl font-black">{telemetry.soil_moisture}%</p>
              <SourceBadge source="sensor" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col text-center">
              <Sun className="mx-auto mb-2 text-yellow-400" size={24} />
              <p className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Light Int.</p>
              <p className="text-2xl font-black">{telemetry.light_intensity || 'N/A'}</p>
              <SourceBadge source="sensor" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col text-center">
              <CloudRain className={`mx-auto mb-2 ${telemetry.rain_status ? 'text-cyan-400' : 'text-gray-500'}`} size={24} />
              <p className="text-xs uppercase tracking-widest text-text-secondary font-bold mb-1">Rain</p>
              <p className="text-2xl font-black">{telemetry.rain_status ? 'YES' : 'NO'}</p>
              <SourceBadge source="sensor" />
            </div>
          </div>
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
