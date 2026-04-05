import { useRef, useState } from 'react'
import { UploadCloud, Camera, Settings, CheckCircle2 } from 'lucide-react'

export default function ImageUploader({ onImageSelect, onDetect, isDetecting, hasImage, previewUrl, mode, setMode, aiProvider, setAiProvider }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files[0])
    }
  }

  return (
    <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[450px] animate-fade-in relative overflow-hidden group">
      {!hasImage ? (
        <div 
          className={`border-2 border-dashed border-panel-border rounded-xl p-12 w-full cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center bg-white/5 ${isDragging ? 'border-primary-color bg-primary-color/10 translate-y-[-2px]' : 'hover:border-primary-color hover:bg-primary-color/5 hover:translate-y-[-2px]'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="w-20 h-20 bg-primary-color/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <UploadCloud className="w-10 h-10 text-primary-color" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Select Plant Leaf</h3>
          <p className="text-text-secondary text-sm max-w-[200px]">Drag & Drop your image or click to browse</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center animate-fade-in">
          <div className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl mb-6">
            <img 
              src={previewUrl} 
              alt="Selected" 
              className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
            />
            {isDetecting && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                 <div className="w-12 h-12 border-4 border-primary-color border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 text-primary-color font-bold mb-1">
               <CheckCircle2 size={18} />
               <span>Image uploaded successfully!</span>
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              className="text-sm text-text-secondary hover:text-white underline underline-offset-4 transition-colors"
            >
              Upload different image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="w-full max-w-[400px] space-y-6">
            <div className="text-left">
              <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <Settings size={14} /> Inference Mode
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-black/30 rounded-xl border border-panel-border">
                {['model', 'api', 'hybrid'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === m ? 'bg-primary-color text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {(mode === 'api' || mode === 'hybrid') && (
              <div className="text-left animate-fade-in mt-2">
                <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings size={14} /> AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-xl border border-panel-border">
                  {['gemini', 'grok'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setAiProvider(provider)}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${aiProvider === provider ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-text-secondary hover:text-white'}`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="w-full py-5 bg-[#059669] text-white rounded-2xl font-black text-xl hover:bg-[#047857] shadow-xl shadow-[#059669]/20 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95" 
              onClick={() => onDetect(mode)} 
              disabled={isDetecting}
            >
              <Camera size={28} className="stroke-[2.5]" />
              {isDetecting ? 'DIAGNOSING...' : 'Analyze Plant Disease'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
