import { useState, useEffect } from 'react'
import {
  Thermometer, Droplets, CloudRain, Layers, Sun, Server,
  Activity, Camera, Radio, RefreshCw, AlertTriangle,
  CheckCircle2, MapPin, Navigation, Wind, Eye, Cloud,
  ArrowRight, Zap, BarChart3, Cpu, Wifi, WifiOff
} from 'lucide-react'
import api from '../config/api'

// ─── Sensor Card ────────────────────────────────────────────
function SensorCard({ icon, label, value, unit, color, isOnline }) {
  return (
    <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)` }}></div>
      <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <p className="relative z-10 text-[9px] uppercase tracking-[0.2em] text-text-secondary font-black mb-1.5">{label}</p>
      <p className="relative z-10 text-2xl font-black text-white">
        {value !== null && value !== undefined ? value : '—'}
        {unit && value !== null && value !== undefined && <span className="text-sm font-medium text-text-secondary ml-0.5">{unit}</span>}
      </p>
      <span className={`relative z-10 inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full border ${
        isOnline
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
          : 'bg-red-500/15 text-red-400 border-red-500/25'
      }`}>
        <Server size={8} /> {isOnline ? 'SENSOR' : 'OFFLINE'}
      </span>
    </div>
  )
}

// ─── Weather Card ───────────────────────────────────────────
function WeatherInfoCard({ icon, label, value, unit, color }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-4 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <p className="text-[8px] uppercase tracking-[0.2em] text-text-secondary font-bold mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}{unit && <span className="text-xs font-medium text-text-secondary ml-0.5">{unit}</span>}</p>
    </div>
  )
}

// ─── Module Card ────────────────────────────────────────────
function ModuleCard({ icon, title, description, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 text-left hover:border-white/20 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden cursor-pointer w-full"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: gradient }}></div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
        <ArrowRight size={24} className="text-white/40" />
      </div>
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-white shadow-xl" style={{ background: gradient }}>
          {icon}
        </div>
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </button>
  )
}

// ═════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════
export default function Dashboard({ onNavigate }) {
  // IoT State
  const [telemetry, setTelemetry] = useState(null)
  const [iotLoading, setIotLoading] = useState(true)
  const [iotError, setIotError] = useState(null)

  // Weather State
  const [weatherLocation, setWeatherLocation] = useState('')
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(null)
  const [isGettingGps, setIsGettingGps] = useState(false)

  // ── Fetch latest IoT data ──
  const fetchTelemetry = async () => {
    try {
      const response = await api.get('/iot-data/latest')
      setTelemetry(response.data)
      setIotError(null)
    } catch (err) {
      setIotError('No sensor data available. Connect your ESP32.')
    } finally {
      setIotLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Get GPS Location ──
  const handleGetGps = () => {
    if (!navigator.geolocation) return
    setIsGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const resp = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await resp.json()
          setWeatherLocation(data.city || data.locality || `${latitude.toFixed(2)},${longitude.toFixed(2)}`)
        } catch {
          setWeatherLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`)
        }
        setIsGettingGps(false)
      },
      () => setIsGettingGps(false),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  // ── Fetch Weather ──
  const handleFetchWeather = async () => {
    if (!weatherLocation.trim()) return
    setWeatherLoading(true)
    setWeatherError(null)
    setWeather(null)
    try {
      const response = await api.get(`/weather?location=${encodeURIComponent(weatherLocation.trim())}`)
      setWeather(response.data)
    } catch (err) {
      setWeatherError(err.response?.data?.error || 'Failed to fetch weather data.')
    } finally {
      setWeatherLoading(false)
    }
  }

  const isOnline = !!telemetry && !iotError

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in flex flex-col gap-8 pb-16">

      {/* ═══ Hero Banner ═══ */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary-color/10 text-primary-color px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Activity size={14} className="animate-pulse" />
          Smart Farming Dashboard
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
          Welcome to <span className="bg-gradient-to-r from-primary-color to-accent-color bg-clip-text text-transparent">AgriShield</span>
        </h2>
        <p className="text-text-secondary text-sm max-w-xl mx-auto">
          Real-time monitoring, AI-powered diagnostics, and precision pest management — all in one place.
        </p>
      </div>

      {/* ═══ Section 1: IoT Sensor Telemetry ═══ */}
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
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <Wifi size={12} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                <WifiOff size={12} /> Offline
              </span>
            )}
            <button onClick={fetchTelemetry} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <RefreshCw size={14} className={`text-text-secondary ${iotLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {iotError ? (
          <div className="bg-red-500/10 text-red-400 p-5 rounded-2xl flex items-center gap-3 font-semibold border border-red-500/20 text-sm">
            <AlertTriangle size={18} /> {iotError}
          </div>
        ) : iotLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-32 border border-white/5"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SensorCard icon={<Thermometer size={22} />} label="Temperature" value={telemetry?.temperature} unit="°C" color="#ef4444" isOnline={isOnline} />
              <SensorCard icon={<Droplets size={22} />} label="Humidity" value={telemetry?.humidity} unit="%" color="#3b82f6" isOnline={isOnline} />
              <SensorCard icon={<Layers size={22} />} label="Soil Moisture" value={telemetry?.soil_moisture} unit="%" color="#f59e0b" isOnline={isOnline} />
              <SensorCard icon={<Sun size={22} />} label="Light Intensity" value={telemetry?.light_intensity || 'N/A'} unit={telemetry?.light_intensity ? ' lux' : ''} color="#eab308" isOnline={isOnline} />
              <SensorCard icon={<CloudRain size={22} />} label="Rain Status" value={telemetry?.rain_status ? 'YES' : 'NO'} unit="" color={telemetry?.rain_status ? '#06b6d4' : '#6b7280'} isOnline={isOnline} />
            </div>
            {telemetry?.timestamp && (
              <p className="text-[10px] text-text-secondary text-right mt-3 font-medium">
                Last updated: {new Date(telemetry.timestamp.replace(' ', 'T') + 'Z').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
              </p>
            )}
          </>
        )}
      </div>

      {/* ═══ Section 2: Weather Data (On-Demand) ═══ */}
      <div className="glass-panel p-6 md:p-8 rounded-[28px] border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <Cloud size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Weather Station</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">OpenWeatherMap — Click to Fetch</p>
          </div>
        </div>

        {/* Location + Fetch */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={weatherLocation}
              onChange={(e) => setWeatherLocation(e.target.value)}
              placeholder="Enter city name (e.g. Mumbai, Delhi)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleGetGps}
            disabled={isGettingGps}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-text-secondary rounded-xl font-bold text-xs transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 shrink-0"
          >
            {isGettingGps ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
            GPS
          </button>
          <button
            onClick={handleFetchWeather}
            disabled={!weatherLocation.trim() || weatherLoading}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {weatherLoading ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
            Get Current Weather
          </button>
        </div>

        {weatherError && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-2 font-semibold border border-red-500/20 text-sm mb-4">
            <AlertTriangle size={16} /> {weatherError}
          </div>
        )}

        {weather ? (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <CheckCircle2 size={14} />
              Live Weather — {weather.location_name}, {weather.country}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <WeatherInfoCard icon={<Thermometer size={18} />} label="Temperature" value={weather.temperature} unit="°C" color="#ef4444" />
              <WeatherInfoCard icon={<Droplets size={18} />} label="Humidity" value={weather.humidity} unit="%" color="#3b82f6" />
              <WeatherInfoCard icon={<CloudRain size={18} />} label="Rainfall" value={weather.rainfall} unit="mm" color="#06b6d4" />
              <WeatherInfoCard icon={<Wind size={18} />} label="Wind" value={weather.wind_speed} unit="m/s" color="#8b5cf6" />
              <WeatherInfoCard icon={<Thermometer size={18} />} label="Feels Like" value={weather.feels_like} unit="°C" color="#f97316" />
              <WeatherInfoCard icon={<Eye size={18} />} label="Visibility" value={weather.visibility ? (weather.visibility / 1000).toFixed(1) : 'N/A'} unit="km" color="#10b981" />
            </div>
            <p className="text-text-secondary text-xs mt-3 capitalize text-center">☁️ {weather.description}</p>
          </div>
        ) : !weatherLoading && (
          <div className="text-center py-8 text-text-secondary">
            <Cloud size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Enter a location and click "Get Current Weather" to load data</p>
          </div>
        )}
      </div>

      {/* ═══ Section 3: Module Navigation Cards ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-6 px-1">
          <BarChart3 size={18} className="text-primary-color" />
          <h3 className="text-lg font-black text-white">Modules</h3>
          <p className="text-text-secondary text-xs">— Select a module to get started</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleCard
            icon={<Radio size={28} />}
            title="IoT Sensor Module"
            description="Live hardware telemetry, threshold alerts, and AI-powered analysis using real-time ESP32 sensor data."
            gradient="linear-gradient(135deg, #059669, #10b981)"
            onClick={() => onNavigate('iot')}
          />
          <ModuleCard
            icon={<Camera size={28} />}
            title="Plant Scan Module"
            description="Upload a leaf image for instant disease detection using ML models, Gemini AI, or Grok Vision."
            gradient="linear-gradient(135deg, #7c3aed, #a78bfa)"
            onClick={() => onNavigate('plantscan')}
          />
          <ModuleCard
            icon={<Activity size={28} />}
            title="Prediction Engine"
            description="Forecast pest & disease risk with location-aware weather data, multi-model AI, and ranked threat analysis."
            gradient="linear-gradient(135deg, #2563eb, #3b82f6)"
            onClick={() => onNavigate('prediction')}
          />
        </div>
      </div>

    </div>
  )
}
