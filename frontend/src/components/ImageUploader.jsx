import { useRef, useState } from 'react'
import { UploadCloud, Image as ImageIcon, Camera } from 'lucide-react'

export default function ImageUploader({ onImageSelect, onDetect, isDetecting, hasImage }) {
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
    <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[350px] animate-fade-in-left">
      <div 
        className={`border-2 border-dashed border-panel-border rounded-md p-12 w-full cursor-pointer transition-all relative overflow-hidden ${isDragging ? 'border-primary-color bg-primary-color/5 translate-y-[-2px]' : 'hover:border-primary-color hover:bg-primary-color/5 hover:translate-y-[-2px]'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <UploadCloud className="w-16 h-16 text-primary-color mb-4 mx-auto" />
        <h3 className="text-xl font-medium mb-2">Drag & Drop your leaf image</h3>
        <p className="text-text-secondary text-sm">or click to browse from your device</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <button 
        className="mt-8 px-8 py-3 bg-primary-color text-white rounded-md font-outfit text-lg font-semibold hover:bg-primary-hover hover:scale-105 hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" 
        onClick={onDetect} 
        disabled={!hasImage || isDetecting}
      >
        <Camera size={20} />
        {isDetecting ? 'Detecting...' : 'Scan Image'}
      </button>
    </div>
  )
}
