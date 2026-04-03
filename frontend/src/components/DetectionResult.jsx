import { AlertCircle, CheckCircle2, HeartPulse, Info, Lightbulb } from 'lucide-react'

// Mock database for startup-ready recommendations
const GET_TIPS = (disease) => {
  const d = disease.toLowerCase();
  if (d.includes('healthy')) return "Keep monitoring regular water and nutrient levels. No action needed.";
  if (d.includes('scab')) return "Prune infected leaves and apply a copper-based fungicide. Improve air circulation.";
  if (d.includes('blight')) return "Remove infected debris immediately. Avoid overhead watering to reduce humidity.";
  if (d.includes('rust')) return "Destroy heavily infected plants. Use sulfur or neem oil sprays.";
  if (d.includes('mold') || d.includes('mildew')) return "Reduce humidity and use baking soda spray or commercial fungicides.";
  return "Consult a local agricultural expert for specific treatment in your region.";
}

export default function DetectionResult({ previewUrl, isDetecting, result, error }) {
  
  if (!previewUrl) {
    return (
      <div className="glass-panel p-8 flex flex-col animate-fade-in-right min-h-[400px]">
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-50">
          <HeartPulse size={48} className="mb-4" />
          <h3 className="text-xl font-semibold">No Image Selected</h3>
          <p>Results will appear here</p>
        </div>
      </div>
    )
  }

  const getTrustLabel = (score) => {
    if (score > 0.85) return { label: 'High Trust', color: 'text-primary-color', bg: 'bg-primary-color' };
    if (score > 0.60) return { label: 'Medium Trust', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'Low Trust / Analysis Needed', color: 'text-error-color', bg: 'bg-error-color' };
  }

  return (
    <div className="glass-panel p-8 flex flex-col animate-fade-in-right">
      <div className="w-full h-[250px] rounded-md overflow-hidden mb-6 border border-panel-border">
        <img src={previewUrl} alt="Leaf Preview" className="w-full h-full object-cover" />
      </div>

      {isDetecting && (
        <div className="flex flex-col items-center py-8">
          <div className="border-4 border-panel-border border-t-primary-color rounded-full w-10 h-10 animate-spin mb-4"></div>
          <p className="text-text-secondary">Processing with Neural Precision...</p>
        </div>
      )}

      {error && !isDetecting && (
        <div className="text-error-color flex gap-2 bg-red-500/10 p-4 rounded-md border border-red-500/20">
          <AlertCircle className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && !isDetecting && (
        <div className="bg-black/20 p-6 rounded-md border border-panel-border">
          <div className="text-2xl font-semibold text-primary-color mb-4 flex items-center gap-2 capitalize">
            {result.disease_name.toLowerCase().includes('healthy') ? (
              <CheckCircle2 className="text-primary-color" />
            ) : (
              <AlertCircle className="text-yellow-500" />
            )}
            {result.disease_name}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${getTrustLabel(result.confidence_score).color}`}>
                {getTrustLabel(result.confidence_score).label}
              </span>
              <span className="text-text-secondary">{(result.confidence_score * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-panel-border rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r from-primary-color to-accent-color`} 
                style={{ width: `${result.confidence_score * 100}%` }}
              ></div>
            </div>
          </div>

          {/* New Startup-Ready Suggestions Section */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mt-6 border-t border-panel-border pt-4">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                <Info size={14} /> Similar potential matches:
              </div>
              <div className="flex gap-2 flex-wrap">
                {result.suggestions.map((s, i) => (
                  <span key={i} className="bg-white/5 px-2 py-0.5 rounded border border-panel-border text-[10px] whitespace-nowrap">
                    {s.name} ({(s.confidence * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Tips Section */}
          <div className="mt-6 bg-primary-color/5 p-4 rounded-md border border-primary-color/10">
            <div className="flex items-center gap-2 text-primary-color font-semibold mb-2">
              <Lightbulb size={18} />
              <span className="text-sm">Startup Recommendation</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {GET_TIPS(result.disease_name)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
