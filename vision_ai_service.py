# vision_ai_service.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import imagehash
import clip
import torch
import numpy as np
from transformers import BlipProcessor, BlipForConditionalGeneration
from transformers import ViTFeatureExtractor, ViTForImageClassification
from typing import Dict, Any, List, Optional
import io
import redis
import json
from datetime import datetime
import cv2

app = FastAPI(
    title="Vision AI Enhanced Service",
    description="Fraud Detection + Smart Labeling + Auto-Categorization",
    version="2.0.0"
)

# CORS configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis cache setup
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Load AI models
print("🤖 Loading AI models...")
device = "cuda" if torch.cuda.is_available() else "cpu"

# CLIP for fraud detection
clip_model, clip_preprocess = clip.load("ViT-B/32", device=device, jit=True)

# BLIP for image captioning
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)

# Vision Transformer for categorization
vit_model = ViTForImageClassification.from_pretrained("google/vit-base-patch16-224").to(device)
vit_processor = ViTFeatureExtractor.from_pretrained("google/vit-base-patch16-224")

print("✅ All AI models loaded successfully!")

# Auction categories mapping
AUCTION_CATEGORIES = [
    "Art", "Books", "Collectibles", "Electronics", "Fashion",
    "Home & Garden", "Jewelry", "Sports", "General", "Music",
    "Toys", "Automotive", "Health", "Tools", "Antiques"
]

FRAUD_PROMPTS = [
    "a professional stock photo with perfect lighting",
    "a generic product photo on white background",
    "a watermarked image from a website",
    "a screenshot of a product page",
    "a real photo of a used item with natural lighting",
    "an authentic auction item photo taken by seller"
]

@app.post("/scan-image")
async def scan_image(
    file: UploadFile = File(...),
    enable_ai: bool = Query(True, description="Enable AI analysis features"),
    enable_fraud_detection: bool = Query(True, description="Enable fraud detection"),
    enable_labeling: bool = Query(True, description="Enable smart labeling"),
    enable_categorization: bool = Query(True, description="Enable auto-categorization")
) -> Dict[str, Any]:
    """
    Comprehensive image analysis with toggle controls
    Returns: Analysis results based on enabled features
    """
    try:
        # Validate image
        image = Image.open(io.BytesIO(await file.read()))
        
        # Generate cache key
        image_hash = str(imagehash.average_hash(image))
        cache_key = f"ai_analysis:{image_hash}:{enable_ai}:{enable_fraud_detection}:{enable_labeling}:{enable_categorization}"
        
        # Check cache first
        cached_result = get_cached_result(cache_key)
        if cached_result:
            print(f"🎯 Cache hit for image {image_hash[:8]}")
            return cached_result
        
        print(f"🔍 Analyzing new image {image_hash[:8]}...")
        
        # Initialize results based on enabled features
        result = {
            "image_hash": image_hash,
            "timestamp": datetime.now().isoformat(),
            "ai_enabled": enable_ai,
            "features_enabled": {
                "fraud_detection": enable_fraud_detection,
                "smart_labeling": enable_labeling,
                "auto_categorization": enable_categorization
            }
        }
        
        if enable_ai:
            # Run AI analysis based on enabled features
            if enable_fraud_detection:
                result["fraud_detection"] = analyze_fraud(image)
            
            if enable_labeling:
                result["smart_labeling"] = generate_labels(image)
            
            if enable_categorization:
                result["auto_categorization"] = categorize_image(image)
            
            # Calculate overall confidence if any AI features are enabled
            ai_results = {
                "fraud_detection": result.get("fraud_detection", {}),
                "smart_labeling": result.get("smart_labeling", {}),
                "auto_categorization": result.get("auto_categorization", {})
            }
            result["overall_confidence"] = calculate_overall_confidence(
                ai_results["fraud_detection"], 
                ai_results["smart_labeling"], 
                ai_results["auto_categorization"]
            )
        else:
            # AI is disabled - provide basic image info only
            result["message"] = "AI analysis disabled - basic image validation only"
            result["basic_info"] = get_basic_image_info(image)
            result["overall_confidence"] = 0.0
        
        # Cache results for 1 hour
        cache_result(cache_key, result, 3600)
        
        return result
        
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

def analyze_fraud(image: Image.Image) -> Dict[str, Any]:
    """Advanced fraud detection using multiple techniques"""
    
    # Perceptual hashing for duplicates
    phash = str(imagehash.phash(image))
    dhash = str(imagehash.dhash(image))
    
    # Check against known fraud database
    is_known_fraud = check_fraud_database(phash, dhash)
    
    # CLIP analysis for stock photo detection
    image_tensor = clip_preprocess(image).unsqueeze(0).to(device)
    text_tokens = clip.tokenize(FRAUD_PROMPTS).to(device)
    
    with torch.no_grad():
        image_features = clip_model.encode_image(image_tensor)
        text_features = clip_model.encode_text(text_tokens)
        
        # Normalize features
        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)
        
        # Calculate similarities
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        
    # Interpret results
    stock_scores = similarity[0][:4].sum().item()  # First 4 are suspicious
    genuine_scores = similarity[0][4:].sum().item()  # Last 2 are genuine
    
    # Additional checks
    quality_score = assess_image_quality(image)
    watermark_detected = detect_watermark(image)
    screenshot_detected = detect_screenshot(image)
    
    # Calculate overall fraud probability
    fraud_probability = calculate_fraud_probability(
        stock_scores, genuine_scores, quality_score, 
        watermark_detected, screenshot_detected, is_known_fraud
    )
    
    return {
        "is_suspicious": fraud_probability > 0.7,
        "fraud_probability": fraud_probability,
        "confidence": min(fraud_probability, 1.0 - genuine_scores),
        "reasons": generate_fraud_reasons(stock_scores, watermark_detected, screenshot_detected, quality_score),
        "known_fraud": is_known_fraud,
        "quality_score": quality_score,
        "technical_details": {
            "phash": phash,
            "dhash": dhash,
            "stock_photo_score": stock_scores,
            "genuine_score": genuine_scores,
            "watermark_detected": watermark_detected,
            "screenshot_detected": screenshot_detected
        }
    }

def generate_labels(image: Image.Image) -> Dict[str, Any]:
    """Generate compelling auction titles and descriptions"""
    
    # Generate basic caption with BLIP
    inputs = blip_processor(images=image, return_tensors="pt").to(device)
    
    with torch.no_grad():
        # Generate multiple captions with different parameters
        captions = []
        for temp in [0.7, 0.9, 1.1]:  # Different creativity levels
            out = blip_model.generate(**inputs, max_length=50, temperature=temp, num_return_sequences=1)
            caption = blip_processor.decode(out[0], skip_special_tokens=True)
            captions.append(caption)
    
    # Select best caption
    best_caption = select_best_caption(captions, image)
    
    # Generate auction-optimized content
    title = generate_auction_title(best_caption, image)
    description = generate_auction_description(best_caption, image)
    key_features = extract_key_features(image)
    
    # SEO optimization
    seo_title = optimize_for_seo(title)
    seo_description = optimize_for_seo(description)
    
    return {
        "generated_caption": best_caption,
        "suggested_title": title,
        "suggested_description": description,
        "key_features": key_features,
        "seo_optimized": {
            "title": seo_title,
            "description": seo_description
        },
        "alternatives": {
            "titles": generate_title_variations(title),
            "descriptions": generate_description_variations(description)
        },
        "confidence": calculate_labeling_confidence(best_caption, image)
    }

def categorize_image(image: Image.Image) -> Dict[str, Any]:
    """Auto-categorize image into auction categories"""
    
    # Preprocess for Vision Transformer
    inputs = vit_processor(images=image, return_tensors="pt").to(device)
    
    with torch.no_grad():
        outputs = vit_model(**inputs)
        logits = outputs.logits
        
        # Get top predictions
        probs = torch.nn.functional.softmax(logits, dim=-1)
        top_probs, top_indices = torch.topk(probs, k=5)
        
    # Map to auction categories (simplified mapping)
    suggested_categories = []
    for i, (prob, idx) in enumerate(zip(top_probs[0], top_indices[0])):
        category = map_imagenet_to_auction_category(idx.item())
        if category and category in AUCTION_CATEGORIES:
            suggested_categories.append({
                "category": category,
                "confidence": prob.item(),
                "rank": i + 1
            })
    
    # Additional category analysis
    secondary_categories = analyze_image_for_auction_categories(image)
    
    # Combine primary and secondary suggestions
    final_suggestions = combine_category_suggestions(suggested_categories, secondary_categories)
    
    return {
        "suggested_categories": final_suggestions[:3],  # Top 3
        "primary_category": final_suggestions[0] if final_suggestions else None,
        "alternatives": final_suggestions[1:3] if len(final_suggestions) > 1 else [],
        "confidence": calculate_categorization_confidence(final_suggestions),
        "analysis_details": {
            "vision_transformer_results": suggested_categories,
            "secondary_analysis": secondary_categories,
            "total_categories_analyzed": len(final_suggestions)
        }
    }

def get_basic_image_info(image: Image.Image) -> Dict[str, Any]:
    """Get basic image information when AI is disabled"""
    width, height = image.size
    
    return {
        "width": width,
        "height": height,
        "format": image.format,
        "mode": image.mode,
        "size_bytes": len(image.tobytes()),
        "aspect_ratio": width / height if height > 0 else 0,
        "is_valid": True
    }

# Helper functions
def check_fraud_database(phash: str, dhash: str) -> bool:
    """Check if image hash exists in fraud database"""
    # In production, query Redis or database
    return r.sismember("fraud:phashes", phash) or r.sismember("fraud:dhashes", dhash)

def assess_image_quality(image: Image.Image) -> float:
    """Assess technical quality of image"""
    width, height = image.size
    
    # Resolution score (0-1)
    resolution_score = min(width * height / (2000 * 2000), 1.0)
    
    # Convert to grayscale for blur detection
    gray = image.convert('L')
    
    # Simple blur detection using edge detection
    img_array = np.array(gray)
    laplacian_var = cv2.Laplacian(img_array, cv2.CV_64F).var()
    blur_score = min(laplacian_var / 1000, 1.0) if laplacian_var > 0 else 0.1
    
    # Combine scores
    return (resolution_score + blur_score) / 2

def detect_watermark(image: Image.Image) -> bool:
    """Detect potential watermarks"""
    img_array = np.array(image)
    
    # Look for semi-transparent overlays
    if image.mode == 'RGBA':
        alpha = np.array(image.split()[-1])
        semi_transparent = np.sum((alpha > 50) & (alpha < 200))
        if semi_transparent > 1000:  # Threshold
            return True
    
    # Look for text-like patterns in corners
    height, width = img_array.shape[:2]
    corners = [
        img_array[0:height//10, 0:width//10],      # Top-left
        img_array[0:height//10, width-width//10:],  # Top-right
        img_array[height-height//10:, 0:width//10], # Bottom-left
        img_array[height-height//10:, width-width//10:] # Bottom-right
    ]
    
    for corner in corners:
        # Simple edge detection for text-like patterns
        gray = cv2.cvtColor(corner, cv2.COLOR_RGB2GRAY) if len(corner.shape) == 3 else corner
        edges = cv2.Canny(gray, 50, 150)
        if np.sum(edges) > 1000:  # High edge density suggests text/watermark
            return True
    
    return False

def detect_screenshot(image: Image.Image) -> bool:
    """Detect if image is a screenshot"""
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # Check for scrollbars (vertical lines on right side)
    right_edge = img_array[:, width-20:width]
    gray_right = cv2.cvtColor(right_edge, cv2.COLOR_RGB2GRAY)
    
    # Look for consistent vertical patterns (scrollbar)
    std_dev = np.std(gray_right, axis=1)
    if np.mean(std_dev) < 10 and np.max(std_dev) > 50:
        return True
    
    # Check for URL bars (top portion)
    top_portion = img_array[0:height//8, :]
    gray_top = cv2.cvtColor(top_portion, cv2.COLOR_RGB2GRAY)
    
    # Look for horizontal lines (URL bar, tabs)
    horizontal_edges = cv2.Sobel(gray_top, cv2.CV_64F, 1, 0, ksize=5)
    if np.mean(np.abs(horizontal_edges)) > 100:
        return True
    
    return False

def calculate_fraud_probability(stock_score, genuine_score, quality_score, watermark, screenshot, known_fraud):
    """Calculate overall fraud probability"""
    weights = {
        "stock_photo": 0.3,
        "watermark": 0.25,
        "screenshot": 0.2,
        "quality": 0.1,
        "known_fraud": 0.15
    }
    
    probabilities = {
        "stock_photo": stock_score,
        "watermark": 1.0 if watermark else 0.0,
        "screenshot": 1.0 if screenshot else 0.0,
        "quality": 1.0 - quality_score,  # Low quality is suspicious
        "known_fraud": 1.0 if known_fraud else 0.0
    }
    
    weighted_prob = sum(weights[key] * probabilities[key] for key in weights)
    
    return min(weighted_prob, 1.0)

def generate_fraud_reasons(stock_score, watermark, screenshot, quality_score):
    """Generate human-readable fraud reasons"""
    reasons = []
    
    if stock_score > 0.6:
        reasons.append("Appears to be a stock photo")
    
    if watermark:
        reasons.append("Contains watermark or overlay")
    
    if screenshot:
        reasons.append("Looks like a screenshot")
    
    if quality_score < 0.3:
        reasons.append("Low image quality")
    
    return reasons if reasons else ["No specific issues detected"]

def select_best_caption(captions, image):
    """Select the most relevant caption"""
    auction_keywords = ["vintage", "rare", "collectible", "authentic", "used", "condition"]
    
    scores = []
    for caption in captions:
        score = 0
        # Length score (not too short, not too long)
        if 20 < len(caption) < 100:
            score += 1
        
        # Keyword score
        for keyword in auction_keywords:
            if keyword.lower() in caption.lower():
                score += 2
        
        scores.append(score)
    
    return captions[np.argmax(scores)]

def generate_auction_title(caption, image):
    """Generate compelling auction title from caption"""
    words = caption.lower().split()
    
    # Auction power words
    power_words = ["Vintage", "Rare", "Authentic", "Collectible", "Premium", "Limited", "Classic", "Original"]
    
    # Generate title
    title_words = []
    
    # Add power word if relevant
    for word in power_words:
        if word.lower() in caption.lower():
            title_words.append(word)
            break
    
    # Add main subject from caption
    main_subject = extract_main_subject(caption)
    if main_subject:
        title_words.append(main_subject)
    
    # Add condition indicator if detected
    if any(word in caption.lower() for word in ["excellent", "good", "fair", "pristine"]):
        title_words.append("- Great Condition")
    
    return " ".join(title_words) if title_words else caption.title()

def generate_auction_description(caption, image):
    """Generate detailed auction description"""
    description_parts = []
    
    # Opening statement
    description_parts.append(f"{caption}. ")
    
    # Add condition assessment
    condition = assess_item_condition(image, caption)
    if condition:
        description_parts.append(f"Item appears to be in {condition} condition. ")
    
    # Add authenticity note
    if any(word in caption.lower() for word in ["authentic", "original", "vintage"]):
        description_parts.append("This appears to be an authentic piece. ")
    
    # Add measurement note
    description_parts.append("Please see photos for exact measurements and details. ")
    
    # Add shipping note
    description_parts.append("Shipped carefully with tracking. ")
    
    return "".join(description_parts)

def extract_key_features(image):
    """Extract key features for bullet points"""
    features = []
    
    # This would use more sophisticated analysis in production
    # For now, generate based on common auction features
    common_features = [
        "High quality construction",
        "Unique design",
        "Collectible item",
        "Great for display",
        "Functional and decorative",
        "Vintage appeal",
        "Rare find",
        "Excellent craftsmanship"
    ]
    
    # Select 3-4 most relevant features
    return np.random.choice(common_features, size=min(4, len(common_features)), replace=False).tolist()

def optimize_for_seo(text):
    """Optimize text for search engines"""
    # Add common auction search terms
    auction_terms = ["auction", "bid", "rare", "collectible", "vintage", "authentic"]
    
    # Capitalize properly
    optimized = text.title()
    
    # Add auction context if not present
    if not any(term in text.lower() for term in ["auction", "bid"]):
        optimized += " - Auction"
    
    return optimized

def map_imagenet_to_auction_category(imagenet_idx):
    """Map ImageNet predictions to auction categories"""
    # Simplified mapping - production would have comprehensive mapping
    mapping = {
        # Electronics
        range(0, 100): "Electronics",
        # Fashion/Clothing
        range(100, 200): "Fashion",
        # Sports equipment
        range(200, 300): "Sports",
        # Art/Antiques
        range(300, 400): "Art",
        # Books/Documents
        range(400, 500): "Books",
        # Jewelry/Accessories
        range(500, 600): "Jewelry",
        # Home items
        range(600, 700): "Home & Garden",
        # Collectibles
        range(700, 800): "Collectibles",
        # Toys/Games
        range(800, 900): "Toys",
        # Default
        range(900, 1000): "General"
    }
    
    for idx_range, category in mapping.items():
        if imagenet_idx in idx_range:
            return category
    
    return "General"

def analyze_image_for_auction_categories(image):
    """Additional category analysis"""
    # This would use additional models or heuristics
    # For now, return empty list
    return []

def combine_category_suggestions(primary, secondary):
    """Combine and rank category suggestions"""
    all_suggestions = primary + secondary
    
    # Remove duplicates and sort by confidence
    seen = set()
    unique_suggestions = []
    for suggestion in all_suggestions:
        if suggestion["category"] not in seen:
            seen.add(suggestion["category"])
            unique_suggestions.append(suggestion)
    
    # Sort by confidence
    return sorted(unique_suggestions, key=lambda x: x["confidence"], reverse=True)

def calculate_overall_confidence(fraud_result, labeling_result, category_result):
    """Calculate overall confidence score"""
    weights = {
        "fraud": 0.4,
        "labeling": 0.35,
        "categorization": 0.25
    }
    
    scores = {
        "fraud": 1.0 - fraud_result.get("fraud_probability", 0.5),  # Lower fraud = higher confidence
        "labeling": labeling_result.get("confidence", 0.5),
        "categorization": category_result.get("confidence", 0.5)
    }
    
    overall_confidence = sum(weights[key] * scores[key] for key in weights)
    return min(overall_confidence, 1.0)

def calculate_labeling_confidence(caption, image):
    """Calculate confidence in labeling results"""
    # Simple heuristic based on caption quality
    if len(caption) > 20 and len(caption) < 100:
        return 0.8
    elif len(caption) >= 100:
        return 0.9
    else:
        return 0.6

def calculate_categorization_confidence(suggestions):
    """Calculate confidence in categorization results"""
    if not suggestions:
        return 0.5
    
    # Use highest confidence score
    return suggestions[0].get("confidence", 0.5)

def extract_main_subject(caption):
    """Extract main subject from caption"""
    # Simple extraction - production would use NLP
    words = caption.split()
    if len(words) > 2:
        return " ".join(words[2:5])  # Take 3-4 words from middle
    return caption

def assess_item_condition(image, caption):
    """Assess item condition from image and caption"""
    # Simple assessment based on keywords
    if any(word in caption.lower() for word in ["excellent", "pristine", "mint"]):
        return "excellent"
    elif any(word in caption.lower() for word in ["good", "nice", "clean"]):
        return "good"
    elif any(word in caption.lower() for word in ["fair", "used", "worn"]):
        return "fair"
    return "used"

def generate_title_variations(title):
    """Generate title variations"""
    variations = [title]
    
    # Add different power words
    power_words = ["Rare", "Vintage", "Collectible", "Authentic", "Premium"]
    for word in power_words[:2]:
        if word not in title:
            variations.append(f"{word} {title}")
    
    return variations

def generate_description_variations(description):
    """Generate description variations"""
    variations = [description]
    
    # Add different closing statements
    closings = [
        "Shipped carefully with tracking.",
        "Fast shipping with insurance.",
        "Professional packaging and shipping.",
        "Secure shipping with tracking number."
    ]
    
    for closing in closings[:2]:
        if closing not in description:
            variations.append(description.replace("Shipped carefully with tracking.", closing))
    
    return variations

# Cache helper functions
def get_cached_result(key: str) -> Optional[Dict]:
    """Get cached analysis result"""
    try:
        cached = r.get(key)
        return json.loads(cached) if cached else None
    except:
        return None

def cache_result(key: str, result: Dict, ttl: int = 3600):
    """Cache analysis result"""
    try:
        r.setex(key, ttl, json.dumps(result))
    except:
        pass

# Health check endpoint
@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": {
            "clip": clip_model is not None,
            "blip": blip_model is not None,
            "vit": vit_model is not None
        },
        "redis_connected": r.ping() if r else False,
        "device": device
    }

# Model info endpoint
@app.get("/models")
async def model_info():
    """Get information about loaded models"""
    return {
        "clip_model": "ViT-B/32",
        "blip_model": "Salesforce/blip-image-captioning-base",
        "vit_model": "google/vit-base-patch16-224",
        "auction_categories": AUCTION_CATEGORIES,
        "supported_features": [
            "fraud_detection",
            "smart_labeling", 
            "auto_categorization",
            "image_hashing",
            "quality_assessment"
        ]
    }

# Feature toggle endpoint
@app.get("/features")
async def get_feature_status(
    enable_ai: bool = Query(True, description="Check AI features status")
):
    """Get current feature toggle status"""
    return {
        "ai_enabled": enable_ai,
        "features_available": {
            "fraud_detection": True,
            "smart_labeling": True,
            "auto_categorization": True,
            "basic_image_info": True
        },
        "system_status": {
            "models_loaded": {
                "clip": clip_model is not None,
                "blip": blip_model is not None,
                "vit": vit_model is not None
            },
            "redis_connected": r.ping() if r else False
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)