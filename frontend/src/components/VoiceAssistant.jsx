import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function VoiceAssistant({ textToSpeak }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [lang, setLang] = useState('hi-IN') // Default Hindi

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleSpeak = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = lang
      utterance.rate = 0.9 // slightly slower for better comprehension
      utterance.onend = () => setIsPlaying(false)
      
      setIsPlaying(true)
      window.speechSynthesis.speak(utterance)
    } else {
      alert("Text-to-speech is not supported in this browser.")
    }
  }

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 py-1.5 px-2 rounded-xl shadow-lg w-max ml-auto">
      <button 
        onClick={handleSpeak}
        title={isPlaying ? "Stop Audio" : "Play Advisory"}
        className={`p-2 rounded-lg transition-all ${isPlaying ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10 text-text-secondary hover:text-white hover:bg-white/20'}`}
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      
      <select 
        value={lang} 
        onChange={(e) => {
            setLang(e.target.value);
            if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
            }
        }}
        className="bg-transparent text-xs text-text-secondary font-bold uppercase tracking-wider outline-none border-none cursor-pointer pr-2 hover:text-white focus:ring-0"
      >
        <option value="en-US" className="text-black">English</option>
        <option value="hi-IN" className="text-black">हिंदी (Hindi)</option>
        <option value="mr-IN" className="text-black">मराठी (Marathi)</option>
      </select>
    </div>
  )
}
