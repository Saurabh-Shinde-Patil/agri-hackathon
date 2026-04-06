import { useState } from 'react'
import { Camera, Settings, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import DetectionResult from '../components/DetectionResult'
import api from '../config/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'

export default function Home() { 
  const { activeFarmId } = useAuth(); 
  const { language } = useLanguage();
  const { modeSelectionEnabled } = useSettings();
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('api')
  const [aiProvider, setAiProvider] = useState('gemini')

  const handleImageSelect = (file) => {
    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleDetect = async (overrideMode) => {
    if (!selectedImage) return
    const useMode = overrideMode || mode

    setIsDetecting(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', selectedImage)
    formData.append('mode', useMode)
    formData.append('ai_provider', aiProvider)
    formData.append('farm_id', activeFarmId)
    formData.append('language', language)

    try {
      const response = await api.post('/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to connect to the server. Make sure backend is running.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  return (
    <main className="w-full h-full flex flex-col">
      {!result && !isDetecting ? (
        /* ── Scan Phase: Two-Column Layout ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in w-full">
          <ImageUploader 
            onImageSelect={handleImageSelect}
            onDetect={handleDetect}
            isDetecting={isDetecting}
            hasImage={!!selectedImage}
            previewUrl={previewUrl}
            mode={mode}
            setMode={setMode}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
          />
          
          <DetectionResult 
            previewUrl={previewUrl}
            isDetecting={isDetecting}
            result={result}
            error={error}
          />
        </div>
      ) : isDetecting && !result ? (
        /* ── Loading Phase: Full Width Diagnostic Animation ── */
        <div className="w-full animate-fade-in">
          <DetectionResult 
            previewUrl={previewUrl}
            isDetecting={isDetecting}
            result={result}
            error={error}
          />
        </div>
      ) : (
        /* ── Result Phase: Full Width with Persistent Mode Controls ── */
        <div className="w-full animate-fade-in space-y-6">
          {/* Persistent Mode Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
            {modeSelectionEnabled && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-primary-color" />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Inference Mode</span>
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
                onClick={() => handleDetect(mode)}
                disabled={isDetecting}
                className="flex items-center gap-2 px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#059669]/20 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isDetecting ? 'animate-spin' : ''} />
                Re-Analyze
              </button>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm transition-all hover:bg-white/10"
              >
                <UploadCloud size={16} />
                New Image
              </button>
            </div>
          </div>

          <DetectionResult 
            previewUrl={previewUrl}
            isDetecting={isDetecting}
            result={result}
            error={error}
            onReset={handleReset}
          />
        </div>
      )}
    </main>
  )
}
