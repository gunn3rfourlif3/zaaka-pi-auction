// components/AICreationAssistant.tsx
import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, CheckCircle, Settings, Loader2 } from 'lucide-react'

interface AIAnalysisResult {
  fraud_detection?: {
    is_suspicious: boolean
    fraud_probability: number
    reasons: string[]
    confidence: number
  }
  smart_labeling?: {
    suggested_title: string
    suggested_description: string
    key_features: string[]
    confidence: number
    alternatives: {
      titles: string[]
      descriptions: string[]
    }
  }
  auto_categorization?: {
    suggested_categories: Array<{
      category: string
      confidence: number
      rank: number
    }>
    primary_category: {
      category: string
      confidence: number
    }
  }
  overall_confidence: number
}

interface AICreationAssistantProps {
  imageFile: File | null
  onAIResults: (results: {
    smart_labeling?: Partial<AIAnalysisResult['smart_labeling']>
    auto_categorization?: Partial<AIAnalysisResult['auto_categorization']>
  }) => void
  className?: string
}

export const AICreationAssistant: React.FC<AICreationAssistantProps> = ({
  imageFile,
  onAIResults,
  className = ""
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTitle, setSelectedTitle] = useState(0)
  const [selectedDescription, setSelectedDescription] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(0)

  useEffect(() => {
    if (imageFile) {
      analyzeImage(imageFile)
    }
  }, [imageFile])

  const analyzeImage = async (file: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('http://localhost:8000/scan-image?enable_ai=true&enable_fraud_detection=true&enable_labeling=true&enable_categorization=true', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      setAnalysis(result)
      
      // Auto-apply high-confidence suggestions
      if (result.overall_confidence > 0.8) {
        applyAISuggestions(result)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      console.error('AI analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyAISuggestions = (result: AIAnalysisResult) => {
    onAIResults({
      smart_labeling: result.smart_labeling,
      auto_categorization: result.auto_categorization
    })
  }

  const handleApplySuggestion = (type: 'title' | 'description' | 'category', index?: number) => {
    if (!analysis) return
    
    switch (type) {
      case 'title':
        onAIResults({
          smart_labeling: {
            suggested_title: analysis.smart_labeling?.alternatives.titles[index || selectedTitle] || ''
          }
        })
        break
      case 'description':
        onAIResults({
          smart_labeling: {
            suggested_description: analysis.smart_labeling?.alternatives.descriptions[index || selectedDescription] || ''
          }
        })
        break
      case 'category':
        onAIResults({
          auto_categorization: {
            primary_category: analysis.auto_categorization?.suggested_categories[index || selectedCategory] || { category: 'General', confidence: 0.5 }
          }
        })
        break
    }
  }

  if (loading) {
    return (
      <div className={`p-6 border-2 border-dashed border-green-200 rounded-[44px] bg-green-50 ${className}`}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-green-500" size={20} />
          <span className="text-green-600 font-black uppercase tracking-tighter text-[11px]">AI ANALYZING IMAGE...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 border-2 border-dashed border-red-200 rounded-[44px] bg-red-50 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span className="font-black uppercase tracking-tighter text-[11px] text-red-600">AI ANALYSIS FAILED</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500 mt-2">{error}</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className={`p-6 border-2 border-dashed border-gray-200 rounded-[44px] bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Sparkles size={20} />
          <span className="font-black uppercase tracking-tighter text-[11px] text-gray-500">AI SUGGESTIONS APPEAR HERE</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mt-2">Upload an image for smart labeling and categorization</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Fraud Detection Alert */}
      {analysis.fraud_detection?.is_suspicious && (
        <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-[40px]">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle size={20} />
            <span className="font-black uppercase tracking-tighter text-[11px] text-red-700">POTENTIAL FRAUD DETECTED</span>
          </div>
          <ul className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-600 space-y-1">
            {analysis.fraud_detection.reasons.map((reason, idx) => (
              <li key={idx}>• {reason}</li>
            ))}
          </ul>
          <div className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-red-500">
            CONFIDENCE: {Math.round(analysis.fraud_detection.confidence * 100)}%
          </div>
        </div>
      )}

      {/* Smart Labeling Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-green-500" size={24} />
          <h3 className="text-lg font-black uppercase tracking-tighter italic text-[#1A1D21]">AI-GENERATED CONTENT</h3>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {Math.round((analysis.smart_labeling?.confidence || 0) * 100)}% CONFIDENCE
          </span>
        </div>

        {/* Title Suggestions */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">SUGGESTED TITLE:</label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-[40px]">
            <p className="text-gray-800 font-black uppercase tracking-tighter text-[11px]">{analysis.smart_labeling?.suggested_title}</p>
          </div>
          {analysis.smart_labeling?.alternatives.titles.length > 1 && (
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">ALTERNATIVES:</p>
              {analysis.smart_labeling.alternatives.titles.slice(1).map((title, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-[40px]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700">{title}</span>
                  <button
                    onClick={() => handleApplySuggestion('title', idx + 1)}
                    className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 hover:text-green-800"
                  >
                    USE
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => handleApplySuggestion('title')}
            className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-[40px] hover:bg-green-600 transition-colors text-[10px] font-black uppercase tracking-[0.1em]"
          >
            APPLY THIS TITLE
          </button>
        </div>

        {/* Description Suggestions */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">SUGGESTED DESCRIPTION:</label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-[40px]">
            <p className="text-gray-800 text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed">{analysis.smart_labeling?.suggested_description}</p>
          </div>
          {analysis.smart_labeling?.key_features.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">KEY FEATURES:</p>
              <ul className="space-y-1">
                {analysis.smart_labeling.key_features.map((feature, idx) => (
                  <li key={idx} className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => handleApplySuggestion('description')}
            className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-[40px] hover:bg-green-600 transition-colors text-[10px] font-black uppercase tracking-[0.1em]"
          >
            APPLY THIS DESCRIPTION
          </button>
        </div>
      </div>

      {/* Auto-Categorization Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 rounded-[40px] flex items-center justify-center">
            <span className="text-green-600 text-[8px] font-black uppercase tracking-[0.2em]">#</span>
          </div>
          <h3 className="text-lg font-black uppercase tracking-tighter italic text-[#1A1D21]">SUGGESTED CATEGORIES</h3>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {Math.round((analysis.auto_categorization?.suggested_categories[0]?.confidence || 0) * 100)}% CONFIDENCE
          </span>
        </div>

        <div className="space-y-2">
          {analysis.auto_categorization?.suggested_categories.map((category, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-[40px] border-2 ${
                idx === 0 
                  ? 'border-green-300 bg-white shadow-lg' 
                  : 'border-gray-200 bg-gray-50 hover:border-green-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                  idx === 0 ? 'text-green-800 text-[11px] font-black tracking-tighter' : 'text-gray-700'
                }`}>
                  {category.category}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full ${
                  idx === 0 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-500 bg-gray-100'
                }`}>
                  {Math.round(category.confidence * 100)}%
                </span>
                {idx === 0 && (
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600">RECOMMENDED</span>
                )}
              </div>
              <button
                onClick={() => handleApplySuggestion('category', idx)}
                className={`px-3 py-1 rounded-[40px] text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${
                  idx === 0
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx === 0 ? 'USE' : 'SELECT'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Confidence */}
      <div className="p-4 bg-[#1A1D21] rounded-[40px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">OVERALL AI CONFIDENCE</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysis.overall_confidence * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
              {Math.round(analysis.overall_confidence * 100)}%
            </span>
          </div>
        </div>
        <div className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
          Based on fraud detection, content quality, and categorization accuracy
        </div>
      </div>
    </div>
  )
}