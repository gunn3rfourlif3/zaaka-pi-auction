// components/AIToggleComponent.tsx
import { useState, useEffect } from 'react'
import { Settings, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

interface AIToggleProps {
  aiEnabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export const AIToggleComponent: React.FC<AIToggleProps> = ({
  aiEnabled,
  onToggle,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [aiServiceStatus, setAiServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [retryCount, setRetryCount] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    checkAIServiceStatus()
    
    // Set up periodic health checks when service is offline
    let interval: NodeJS.Timeout | null = null
    if (aiServiceStatus === 'offline') {
      interval = setInterval(() => {
        checkAIServiceStatus()
      }, 30000) // Check every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [aiServiceStatus])

  const checkAIServiceStatus = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('http://localhost:8000/health', {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setAiServiceStatus(data.status === 'healthy' ? 'online' : 'offline')
      } else {
        setAiServiceStatus('offline')
      }
    } catch (error) {
      console.warn('AI service not available:', error)
      setAiServiceStatus('offline')
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setAiServiceStatus('checking')
    checkAIServiceStatus()
  }

  const handleToggle = async () => {
    if (aiServiceStatus === 'offline') {
      // Instead of alert, show inline message
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate toggle delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      onToggle(!aiEnabled)
    } catch (error) {
      console.error('Error toggling AI:', error)
      alert('Error toggling AI features. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Minimalist AI Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={aiServiceStatus === 'offline' ? handleRetry : handleToggle}
          disabled={isLoading || aiServiceStatus === 'checking'}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 ${
            aiServiceStatus === 'offline' ? 'bg-gray-300 cursor-not-allowed' :
            aiEnabled ? 'bg-green-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              aiEnabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            aiServiceStatus === 'online' ? 'bg-green-500' : 
            aiServiceStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-[9px] font-medium text-gray-600">
            {aiEnabled ? 'AI' : 'Standard'}
          </span>
        </div>

        {/* Tooltip trigger */}
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Sparkles size={12} />
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
              <div className="text-[10px] font-semibold text-gray-800 mb-2">AI Features</div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${
                    aiServiceStatus === 'offline' ? 'text-red-500' :
                    aiEnabled ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    <Sparkles size={10} />
                  </div>
                  <div>
                    <div className="text-[9px] font-medium text-gray-700">Fraud Detection</div>
                    <div className="text-[8px] text-gray-500">
                      {aiServiceStatus === 'offline' ? 'Unavailable' : 'Detects suspicious images'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${
                    aiServiceStatus === 'offline' ? 'text-red-500' :
                    aiEnabled ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    <Sparkles size={10} />
                  </div>
                  <div>
                    <div className="text-[9px] font-medium text-gray-700">Smart Labeling</div>
                    <div className="text-[8px] text-gray-500">
                      {aiServiceStatus === 'offline' ? 'Unavailable' : 'Auto-generates titles & descriptions'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${
                    aiServiceStatus === 'offline' ? 'text-red-500' :
                    aiEnabled ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    <Sparkles size={10} />
                  </div>
                  <div>
                    <div className="text-[9px] font-medium text-gray-700">Auto-Categorization</div>
                    <div className="text-[8px] text-gray-500">
                      {aiServiceStatus === 'offline' ? 'Unavailable' : 'Suggests categories'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-[8px] text-gray-500">
                  {aiServiceStatus === 'offline' ? 'AI service offline - retrying...' :
                   aiEnabled ? 'AI features active' : 'Enable for smart assistance'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 mt-1">
          <div className="flex items-center gap-1">
            <Settings className="animate-spin text-green-500" size={10} />
            <span className="text-[8px] text-green-600">Updating...</span>
          </div>
        </div>
      )}
    </div>
  )
}