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
      <div className="glass-panel result-card">
        <div className="result-placeholder">
          <HeartPulse size={48} opacity={0.5} style={{ marginBottom: '1rem' }} />
          <h3>No Image Selected</h3>
          <p>Results will appear here</p>
        </div>
      </div>
    )
  }

  const getTrustLabel = (score) => {
    if (score > 0.85) return { label: 'High Trust', color: '#10b981' };
    if (score > 0.60) return { label: 'Medium Trust', color: '#f59e0b' };
    return { label: 'Low Trust / Analysis Needed', color: '#ef4444' };
  }

  return (
    <div className="glass-panel result-card">
      <div className="preview-container">
        <img src={previewUrl} alt="Leaf Preview" className="preview-image" />
      </div>

      {isDetecting && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
          <div className="loader"></div>
          <p>Processing with Neural Precision...</p>
        </div>
      )}

      {error && !isDetecting && (
        <div style={{ color: 'var(--error-color)', display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle />
          <p>{error}</p>
        </div>
      )}

      {result && !isDetecting && (
        <div className="detection-info">
          <div className="disease-name">
            {result.disease_name.toLowerCase().includes('healthy') ? (
              <CheckCircle2 color="var(--primary-color)" />
            ) : (
              <AlertCircle color="#f59e0b" />
            )}
            {result.disease_name}
          </div>
          
          <div className="confidence-section">
            <div className="confidence-header">
              <span style={{ color: getTrustLabel(result.confidence_score).color, fontWeight: 600 }}>
                {getTrustLabel(result.confidence_score).label}
              </span>
              <span>{(result.confidence_score * 100).toFixed(1)}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${result.confidence_score * 100}%`,
                  background: `linear-gradient(90deg, ${getTrustLabel(result.confidence_score).color}, var(--accent-color))`
                }}
              ></div>
            </div>
          </div>

          {/* New Startup-Ready Suggestions Section */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <Info size={14} /> Similar potential matches:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {result.suggestions.map((s, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--panel-border)' }}>
                    {s.name} ({(s.confidence * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Tips Section */}
          <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Lightbulb size={18} />
              Startup Recommendation
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {GET_TIPS(result.disease_name)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
