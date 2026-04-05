import { AlertCircle, CheckCircle2, HeartPulse, Info, Lightbulb, Leaf, Shield, Wind, Bug, ThermometerSun, Sprout, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import VoiceAssistant from './VoiceAssistant'

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
               <p className="text-text-secondary text-xs mt-1">Probability</p>
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
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Immediate Action</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.immediate || advisory.chemical || "Consult expert."}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Leaf size={20} className="text-green-400 shrink-0" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Organic Control</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.organic || "No specific organic."}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Shield size={20} className="text-blue-400 shrink-0" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Preventive Steps</p>
              <p className="text-white/80 text-sm leading-relaxed">{advisory.preventive || "Implement standard protocols."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DetectionResult({ previewUrl, isDetecting, result, error, onReset }) {
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    if (isDetecting) {
      setLoadingStep(0)
      const timers = [
        setTimeout(() => setLoadingStep(1), 800),
        setTimeout(() => setLoadingStep(2), 1800),
        setTimeout(() => setLoadingStep(3), 2800),
      ]
      return () => timers.forEach(clearTimeout)
    }
  }, [isDetecting])

  /* ── Empty State ── */
  if (!previewUrl && !result) {
    return (
      <div className="glass-panel p-8 flex flex-col animate-fade-in min-h-[400px] w-full max-w-4xl mx-auto border-2 border-dashed border-white/5">
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-50">
          <HeartPulse size={64} className="mb-4 stroke-[1.5]" />
          <h3 className="text-xl font-bold">Waiting for Image...</h3>
          <p className="text-sm">Scan results and expert advice will appear here</p>
        </div>
      </div>
    )
  }

  /* ── Loading State ── */
  if (isDetecting) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center animate-fade-in min-h-[600px] w-full max-w-4xl mx-auto shadow-2xl bg-gradient-to-br from-primary-color/5 to-transparent">
        <div className="relative mb-8">
           <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-primary-color animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <Sprout size={48} className="text-primary-color animate-pulse" />
           </div>
        </div>
        
        <h2 className="text-4xl font-black text-white mb-2">Diagnosing Plant</h2>
        <div className="flex gap-1 mb-8">
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary-color animate-bounce"></div>
        </div>

        <div className="w-full max-w-md space-y-4">
          {[
            { step: 1, icon: <Bug size={18} />, doneIcon: <CheckCircle2 size={18} />, text: 'Examining symptoms...' },
            { step: 2, icon: <ThermometerSun size={18} />, doneIcon: <CheckCircle2 size={18} />, text: 'Running health analysis...' },
            { step: 3, icon: <Leaf size={18} />, doneIcon: <CheckCircle2 size={18} />, text: 'Generating treatment recommendations...' },
          ].map(({ step, icon, doneIcon, text }) => (
            <div key={step} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${loadingStep >= step ? 'bg-primary-color/10 translate-x-2 opacity-100' : 'opacity-40 translate-x-0'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loadingStep >= step ? 'bg-primary-color text-white' : 'bg-white/10 text-white/50'}`}>
                {loadingStep >= step ? doneIcon : icon}
              </div>
              <span className={`font-semibold ${loadingStep >= step ? 'text-white' : 'text-text-secondary'}`}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Error State ── */
  if (error && !result) {
    return (
      <div className="max-w-4xl mx-auto w-full text-center p-12 glass-panel border-error-color/30">
         <AlertCircle size={48} className="text-error-color mx-auto mb-4" />
         <h3 className="text-2xl font-bold mb-2">Analysis Failed</h3>
         <p className="text-text-secondary mb-8">{error}</p>
         <button onClick={onReset} className="px-10 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all">Back to Upload</button>
      </div>
    )
  }

  /* ── Image selected but not yet scanned ── */
  if (!result) {
    return (
      <div className="glass-panel p-8 flex flex-col animate-fade-in min-h-[400px] w-full max-w-4xl mx-auto border-2 border-dashed border-white/5">
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-50">
          <HeartPulse size={64} className="mb-4 stroke-[1.5]" />
          <h3 className="text-xl font-bold">Image Ready</h3>
          <p className="text-sm">Click "Analyze Plant Disease" to begin diagnosis</p>
        </div>
      </div>
    )
  }

  /* ── Result State ── */
  const confidencePercent = (parseFloat(result.confidence) * 100).toFixed(0)

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto pb-32 animate-fade-in">

      {result && (
        <div className="space-y-8">

          {/* ══ Row 1: Image + Diagnosis Info (Two Columns) ══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Image Preview */}
            <div className="glass-panel p-3 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl">
                <img src={previewUrl} alt="Leaf" className="w-full h-full object-cover transition-transform hover:scale-110 duration-1000" />
              </div>
            </div>
            
            {/* Right: Disease Name, Plant Name, Confidence */}
            <div className="flex flex-col gap-5">
              {/* Disease & Plant Names */}
              <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex-1 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-primary-color uppercase tracking-[0.3em] mb-3 leading-none">Diagnostic Result</p>
                  <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-[0_5px_15px_rgba(255,255,255,0.08)]">
                    {result.disease}
                  </h1>
                  <p className="text-lg text-primary-color/70 font-medium">
                    {result.plant || 'Unknown Plant'}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                  <Leaf size={200} />
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 flex gap-8 items-center">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">Accuracy Confidence</p>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ${parseFloat(result.confidence) > 0.85 ? 'bg-primary-color' : 'bg-yellow-500'}`}
                      style={{ width: `${confidencePercent}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`text-3xl font-black ${parseFloat(result.confidence) > 0.85 ? 'text-primary-color' : 'text-yellow-500'}`}>
                  {confidencePercent}%
                </div>
              </div>

              {/* Source & Mode Tags */}
              <div className="flex gap-3 text-[10px] font-black tracking-widest uppercase px-1">
                <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-text-secondary">Source: {result.source}</span>
                <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-text-secondary">Mode: {result.mode}</span>
              </div>
            </div>
          </div>

          {/* ══ Row 2: Priority Action (Full Width, Single Column) ══ */}
          <div className="bg-primary-color/10 p-8 rounded-3xl border-2 border-primary-color/30 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-[0.06] group-hover:opacity-10 transition-opacity">
              <Shield size={140} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-primary-color font-black text-sm uppercase tracking-widest">
                  <CheckCircle2 size={24} />
                  Priority Action
                </div>
                <VoiceAssistant textToSpeak={result.core_recommendation || "Consult a specialist based on these indicators."} />
              </div>
              <p className="text-2xl text-white font-medium leading-relaxed">
                {result.core_recommendation || "Consult a specialist based on these indicators."}
              </p>
            </div>
          </div>

          {/* ══ Row 3: Description (Full Width) ══ */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-primary-color mb-6 uppercase tracking-widest font-black text-xs">
              <Info size={18} />
              About this condition
            </div>
            <p className="text-lg text-text-secondary leading-relaxed font-light italic border-l-4 border-primary-color/30 pl-6">
              "{result.description || 'Description data is currently unavailable.'}"
            </p>
          </div>

          {/* ══ Ranked Additional Diseases (If present) ══ */}
          {result.diseases && result.diseases.length > 1 && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/10">
              <div className="flex items-center gap-3 text-red-500 font-black mb-6 uppercase tracking-widest text-xs">
                <Bug size={18} />
                Other Potential Threats Identified
              </div>
              <div className="flex flex-col">
                {result.diseases.slice(1).map((dis, idx) => (
                  <RankedThreatCard key={idx} threat={dis} color="#ef4444" />
                ))}
              </div>
            </div>
          )}

          {/* ══ Row 4: Analysis Grid — Symptoms, Causes, How It Spreads ══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Symptoms Card */}
            <div className="bg-card-bg p-8 rounded-[40px] shadow-2xl shadow-black/20 group hover:translate-y-[-4px] transition-all border border-card-border">
              <div className="flex items-center gap-3 text-[#059669] font-black mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#059669]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bug size={24} />
                </div>
                <h3 className="text-xl">Common Symptoms</h3>
              </div>
              <p className="text-card-text-secondary leading-relaxed text-sm">
                {result.symptoms || 'Symptom data not available.'}
              </p>
            </div>

            {/* Causes Card (NEW — same style as Symptoms) */}
            <div className="bg-card-bg p-8 rounded-[40px] shadow-2xl shadow-black/20 group hover:translate-y-[-4px] transition-all border border-card-border">
              <div className="flex items-center gap-3 text-[#d97706] font-black mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#d97706]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl">Likely Causes</h3>
              </div>
              <p className="text-card-text-secondary leading-relaxed text-sm">
                {result.causes || 'Cause analysis is currently unavailable.'}
              </p>
            </div>

            {/* How It Spreads Card */}
            <div className="bg-card-bg p-8 rounded-[40px] shadow-2xl shadow-black/20 group hover:translate-y-[-4px] transition-all md:col-span-2 border border-card-border">
              <div className="flex items-center gap-3 text-[#2563eb] font-black mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wind size={24} />
                </div>
                <h3 className="text-xl">How It Spreads</h3>
              </div>
              <p className="text-card-text-secondary leading-relaxed text-sm">
                {result.how_it_spreads || 'Transmission data is currently under verification.'}
              </p>
            </div>
          </div>

          {/* ══ Row 5: Care Recommendations (Numbered List) ══ */}
          <div className="bg-card-bg p-10 rounded-[40px] shadow-2xl shadow-black/20 border border-card-border">
            <div className="flex items-center gap-3 text-[#059669] font-black mb-10 pb-6 border-b border-card-border">
              <Leaf size={28} />
              <h3 className="text-3xl tracking-tight">Care Recommendations</h3>
            </div>
            
            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#059669]/20">1</div>
                <div className="pt-2">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Organic Control</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">{result.advisory?.organic || 'No organic recommendation available.'}</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#059669]/20">2</div>
                <div className="pt-2">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Chemical Solution</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">{result.advisory?.chemical || 'No chemical recommendation available.'}</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#059669]/20">3</div>
                <div className="pt-2">
                  <p className="text-card-text font-bold mb-1 uppercase tracking-widest text-[10px]">Prevention</p>
                  <p className="text-card-text-secondary text-lg leading-relaxed font-medium">{result.advisory?.preventive || 'No preventive recommendation available.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Scan Again */}
          <div className="flex justify-center pt-10">
            <button 
              onClick={onReset}
              className="px-16 py-5 bg-panel-bg border border-panel-border hover:opacity-80 rounded-3xl font-black text-text-primary transition-all hover:scale-105"
            >
              Scan Another Plant
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
