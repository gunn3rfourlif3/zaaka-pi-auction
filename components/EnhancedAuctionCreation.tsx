// components/EnhancedAuctionCreation.tsx
import { useState, useEffect } from 'react'
import { Upload, Sparkles, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { AICreationAssistant } from './AICreationAssistant'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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
  basic_info?: {
    width: number
    height: number
    format: string
    mode: string
    size_bytes: number
    aspect_ratio: number
    is_valid: boolean
  }
}

interface EnhancedAuctionCreationProps {
  onAuctionCreated: (auction: any) => void
  className?: string
  onSwitchToStandard?: () => void
}

export const EnhancedAuctionCreation: React.FC<EnhancedAuctionCreationProps> = ({
  onAuctionCreated,
  className = "",
  onSwitchToStandard
}) => {
  const aiEnabled = true
  const [aiServiceStatus, setAiServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [aiResults, setAiResults] = useState<AIAnalysisResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    startingBid: '',
    duration: '7',
    buyNowPrice: ''
  })
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [fraudAlert, setFraudAlert] = useState<string | null>(null)

  // Check AI service status on mount
  useEffect(() => {
    checkAIServiceStatus()
  }, [])

  // Check AI service status
  const checkAIServiceStatus = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
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

  // Handle AI results from assistant
  const handleAIResults = (results: Partial<AIAnalysisResult>) => {
    setAiResults(prev => ({ ...prev, ...results } as AIAnalysisResult))
    
    // Auto-fill high-confidence suggestions
    if (results.smart_labeling) {
      setFormData(prev => ({
        ...prev,
        title: results.smart_labeling?.suggested_title || prev.title,
        description: results.smart_labeling?.suggested_description || prev.description
      }))
    }
    
    if (results.auto_categorization?.primary_category) {
      setFormData(prev => ({
        ...prev,
        category: results.auto_categorization?.primary_category?.category || prev.category
      }))
    }
  }

  // Enhanced image upload with AI analysis
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileArray = Array.from(files)
      setImageFiles(fileArray)

      // Process each file
      const uploadPromises = fileArray.map(async (file, index) => {
        setUploadProgress((index / fileArray.length) * 50)

        if (aiEnabled && aiServiceStatus === 'online') {
          // AI-enabled upload
          try {
            const aiFormData = new FormData()
            aiFormData.append('file', file)

            const aiResponse = await fetch(
              `http://localhost:8000/scan-image?enable_ai=true&enable_fraud_detection=true&enable_labeling=true&enable_categorization=true`,
              {
                method: 'POST',
                body: aiFormData,
              }
            )

            if (aiResponse.ok) {
              const aiResult = await aiResponse.json()
              
              // Check for fraud
              if (aiResult.fraud_detection?.is_suspicious && aiResult.fraud_detection.confidence > 0.7) {
                const userConfirmed = await MySwal.fire({
                  title: '⚠️ Potential Fraud Detected',
                  html: `
                    <p class="mb-4 text-left">Our AI has flagged this image for the following reasons:</p>
                    <ul class="list-disc pl-5 text-left mb-4 text-red-600 font-bold">
                      ${aiResult.fraud_detection.reasons.map((r: string) => `<li>${r}</li>`).join('')}
                    </ul>
                    <p class="text-sm text-gray-500">Confidence: ${Math.round(aiResult.fraud_detection.confidence * 100)}%</p>
                  `,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#d33',
                  cancelButtonColor: '#3085d6',
                  confirmButtonText: 'Continue Anyway',
                  cancelButtonText: 'Cancel Upload'
                });
                
                if (!userConfirmed.isConfirmed) {
                  throw new Error('Upload cancelled by user due to fraud detection')
                }
              }

              // Store AI results for first image
              if (index === 0) {
                setAiResults(aiResult)
                setShowAIAssistant(true)
              }
            }
          } catch (aiError) {
            console.warn('AI analysis failed, proceeding with standard upload:', aiError)
            // Fallback to standard upload
            setAiServiceStatus('offline')
            // Don't show AI assistant if analysis fails
            setShowAIAssistant(false)
          }
        }

        // Standard upload (works for both AI and non-AI modes)
        setUploadProgress(50 + (index / fileArray.length) * 50)
        
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const uploadData = await uploadResponse.json()
        return uploadData.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImageUrls(uploadedUrls)
      setUploadProgress(100)

      // Show success message
      if (aiEnabled && aiResults) {
        toast.success(`Upload complete! AI analysis results are available below.`)
      } else {
        toast.success(`Upload complete! ${fileArray.length} image(s) uploaded successfully.`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (imageUrls.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    if (!formData.title || !formData.description) {
      toast.error('Please fill in title and description')
      return
    }

    try {
      const auctionData = {
        ...formData,
        imageUrls,
        aiEnhanced: aiEnabled,
        aiResults: aiEnabled ? aiResults : null
      }

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData),
      })

      if (!response.ok) {
        throw new Error('Failed to create auction')
      }

      const newAuction = await response.json()
      onAuctionCreated(newAuction)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'General',
        startingBid: '',
        duration: '7',
        buyNowPrice: ''
      })
      setImageUrls([])
      setImageFiles([])
      setAiResults(null)
      setShowAIAssistant(false)
      
      MySwal.fire({
        title: 'Success!',
        text: 'Your AI-Enhanced Auction is now live.',
        icon: 'success',
        confirmButtonText: 'View Inventory',
        confirmButtonColor: '#22c55e'
      })

    } catch (error) {
      console.error('Error creating auction:', error)
      MySwal.fire({
        title: 'Error',
        text: 'Failed to create auction. Please try again.',
        icon: 'error'
      })
    }
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white rounded-[44px] shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1A1D21] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">
                CREATE AI AUCTION
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mt-1">
                AI-POWERED LISTING
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchToStandard && onSwitchToStandard()}
              className="px-3 py-1.5 rounded-[40px] text-[9px] font-black uppercase tracking-[0.2em] transition-all bg-white/10 text-white hover:bg-white/15"
            >
              STANDARD
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload - AI-First Design */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
                AUCTION IMAGES {aiEnabled ? '(AI-POWERED)' : ''}
              </label>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-[40px] p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-green-500" size={32} />
                  ) : (
                    <Upload className="text-gray-400" size={32} />
                  )}
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">
                    {isUploading ? (
                      <>
                        <p className="font-black">UPLOADING...</p>
                        <div className="w-32 bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-1">{Math.round(uploadProgress)}%</p>
                      </>
                    ) : (
                      <>
                        <p className="font-black">
                          {aiEnabled ? 'DROP IMAGES FOR AI ANALYSIS' : 'DROP IMAGES TO UPLOAD'}
                        </p>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
                          {aiEnabled ? 'AI will scan for fraud & suggest content' : 'Standard upload'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Image Preview */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Auction image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-[40px] border"
                    />
                    {aiEnabled && index === 0 && aiResults?.fraud_detection?.is_suspicious && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-[40px]">
                        <AlertTriangle size={16} />
                      </div>
                    )}
                    {aiEnabled && index === 0 && !aiResults?.fraud_detection?.is_suspicious && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-[40px]">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant - Only visible in AI mode */}
          {aiEnabled && showAIAssistant && aiResults && (
            <div className="transition-all duration-300 ease-in-out">
              <AICreationAssistant
                imageFile={imageFiles[0] || null}
                onAIResults={handleAIResults}
                className="border border-green-200 rounded-[40px] bg-green-50"
              />
            </div>
          )}

          {/* AI-Enhanced Form Fields - Hidden in standard mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
                {aiEnabled ? 'AUCTION TITLE (AI-ENHANCED)' : 'AUCTION TITLE'}
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-[40px] focus:ring-2 focus:border-green-500 ${
                  aiEnabled ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder={aiEnabled ? "AI will suggest compelling title..." : "Enter auction title"}
                required
              />
              {aiEnabled && (
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 mt-1">
                  {aiResults?.smart_labeling?.suggested_title ? '✨ AI suggestion ready' : '🤖 AI will suggest after upload'}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
                {aiEnabled ? 'CATEGORY (AI SUGGESTED)' : 'CATEGORY'}
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-[40px] focus:ring-2 focus:border-green-500 ${
                  aiEnabled ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              >
                {aiEnabled && aiResults?.auto_categorization?.suggested_categories?.[0] && (
                  <>
                    <option value={aiResults.auto_categorization.suggested_categories[0].category}>
                      🔥 {aiResults.auto_categorization.suggested_categories[0].category} (AI Suggested)
                    </option>
                    <option disabled>─────────────────────</option>
                  </>
                )}
                <option value="General">General</option>
                <option value="Art">Art</option>
                <option value="Books">Books</option>
                <option value="Collectibles">Collectibles</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Toys">Toys</option>
                <option value="Automotive">Automotive</option>
                <option value="Health">Health</option>
                <option value="Tools">Tools</option>
                <option value="Antiques">Antiques</option>
              </select>
              {aiEnabled && (
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 mt-1">
                  {aiResults?.auto_categorization?.suggested_categories?.[0] ? '✨ AI category ready' : '🤖 Upload images for AI category'}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="startingBid" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
                STARTING BID ($)
              </label>
              <input
                type="number"
                id="startingBid"
                value={formData.startingBid}
                onChange={(e) => setFormData(prev => ({ ...prev, startingBid: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-[40px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
                DURATION (DAYS)
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-[40px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="1">1 DAY</option>
                <option value="3">3 DAYS</option>
                <option value="5">5 DAYS</option>
                <option value="7">7 DAYS</option>
                <option value="14">14 DAYS</option>
                <option value="30">30 DAYS</option>
              </select>
            </div>

            <div>
              <label htmlFor="buyNowPrice" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
                BUY NOW PRICE ($) - OPTIONAL
              </label>
              <input
                type="number"
                id="buyNowPrice"
                value={formData.buyNowPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, buyNowPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-[40px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">
              {aiEnabled ? 'DESCRIPTION (AI-ENHANCED)' : 'DESCRIPTION'}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className={`w-full px-3 py-2 border rounded-[40px] focus:ring-2 focus:border-green-500 ${
                aiEnabled ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
              placeholder={aiEnabled ? "AI will generate compelling description..." : "Describe your auction item"}
              required
            />
            {aiEnabled && (
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 mt-1">
                {aiResults?.smart_labeling?.suggested_description ? '✨ AI description ready' : '🤖 Upload images for AI description'}
              </div>
            )}
          </div>

          {/* Submit Button - Mode Specific */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  category: 'General',
                  startingBid: '',
                  duration: '7',
                  buyNowPrice: ''
                })
                setImageUrls([])
                setImageFiles([])
                setAiResults(null)
                setShowAIAssistant(false)
              }}
              className={`px-6 py-2 rounded-[40px] text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                aiEnabled 
                  ? 'border border-green-300 text-green-700 hover:bg-green-50' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              CLEAR FORM
            </button>
            <button
              type="submit"
              disabled={isUploading || imageUrls.length === 0}
              className={`px-6 py-2 rounded-[40px] hover:transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] ${
                aiEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {aiEnabled && <Sparkles size={16} />}
              {aiEnabled ? 'CREATE AI AUCTION' : 'CREATE AUCTION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
