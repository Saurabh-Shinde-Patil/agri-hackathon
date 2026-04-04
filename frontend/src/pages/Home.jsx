import { useState } from 'react'
import ImageUploader from '../components/ImageUploader'
import DetectionResult from '../components/DetectionResult'
import api from '../config/api'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleImageSelect = (file) => {
    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleDetect = async (mode) => {
    if (!selectedImage) return

    setIsDetecting(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', selectedImage)
    formData.append('mode', mode)

    try {
      // Use configured API instance
      const response = await api.post('/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to connect to the server. Make sure backend is running.')
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
      <ImageUploader 
        onImageSelect={handleImageSelect}
        onDetect={handleDetect}
        isDetecting={isDetecting}
        hasImage={!!selectedImage}
      />
      
      <DetectionResult 
        previewUrl={previewUrl}
        isDetecting={isDetecting}
        result={result}
        error={error}
      />
    </main>
  )
}
