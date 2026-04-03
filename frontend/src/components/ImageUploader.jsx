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
    <div className="glass-panel uploader-card">
      <div 
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <UploadCloud className="drop-icon" />
        <h3 className="drop-text">Drag & Drop your leaf image</h3>
        <p className="drop-subtext">or click to browse from your device</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
      </div>

      <button 
        className="btn-upload" 
        onClick={onDetect} 
        disabled={!hasImage || isDetecting}
      >
        <Camera size={20} />
        {isDetecting ? 'Detecting...' : 'Scan Image'}
      </button>
    </div>
  )
}
