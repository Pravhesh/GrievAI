from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from transformers import pipeline
from cachetools import TTLCache
import os
import asyncio
from hashlib import sha256
import logging
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="GrievAI Classifier", version="0.1.0")

# Allow frontend running on Vite (localhost:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model (allow override via env for smaller/fine-tuned checkpoint)
MODEL_NAME = os.getenv("HF_MODEL", "facebook/bart-large-mnli")
logger.info(f"Loading zero-shot model: {MODEL_NAME}")
classifier = pipeline("zero-shot-classification", model=MODEL_NAME)

# Map of possible AI labels to our supported categories
CATEGORY_MAPPING = {
    # AI Label: Standardized Category
    "Water": "Water",
    "Power": "Electricity",
    "Electricity": "Electricity",
    "Road": "Road",
    "Sanitation": "Sanitation",
    "Health": "Health",
    "Education": "Education",
    "Spam": "Other",
    "Other": "Other"
}

# === Simple in-memory cache ===
CACHE_TTL_SEC = int(os.getenv("CACHE_TTL_SEC", "3600"))  # default 1h
CACHE_MAXSIZE = int(os.getenv("CACHE_MAXSIZE", "1024"))
cache: TTLCache = TTLCache(maxsize=CACHE_MAXSIZE, ttl=CACHE_TTL_SEC)
logger.info(f"Initialized TTL cache – size {CACHE_MAXSIZE}, ttl {CACHE_TTL_SEC}s")

# These are the categories we'll use for classification
CANDIDATE_LABELS = list(set(CATEGORY_MAPPING.keys()))

# This is the list of categories we'll actually use in the app
SUPPORTED_CATEGORIES = sorted(list(set(CATEGORY_MAPPING.values())))


class ComplaintIn(BaseModel):
    text: str


class ClassificationOut(BaseModel):
    label: str
    score: float


CLASSIFICATION_TIMEOUT = int(os.getenv("CLASSIFICATION_TIMEOUT_SEC", "20"))  # max seconds per request

@app.post("/classify", response_model=ClassificationOut)
async def classify_complaint(complaint: ComplaintIn):
    try:
        if not complaint.text or not complaint.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty"
            )
            
        normalized_text = complaint.text.strip().lower()
        cache_key = sha256(normalized_text.encode()).hexdigest()

        # Check cache first
        if cache_key in cache:
            logger.info("Cache hit – returning previous classification result")
            return cache[cache_key]

        logger.info(f"Cache miss – classifying complaint: {complaint.text[:80]}…")

        # Run blocking classification in thread pool with timeout
        loop = asyncio.get_running_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: classifier(
                        complaint.text,
                        candidate_labels=CANDIDATE_LABELS,
                        multi_label=False
                    )
                ),
                timeout=CLASSIFICATION_TIMEOUT
            )
        except asyncio.TimeoutError:
            logger.warning("Classification timed out")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail="Classification timed out")
        
        # Get the top label and its score
        top_label = result["labels"][0]
        top_score = result["scores"][0]
        
        # Map to our standardized categories
        standardized_label = CATEGORY_MAPPING.get(top_label, "Other")
        
        logger.info(
            f"Classification - Original: {top_label} ({top_score:.2f}), "
            f"Mapped: {standardized_label}"
        )
        
        response = {
            "label": standardized_label,
            "score": top_score,
            "original_label": top_label
        }
        # Store in cache
        cache[cache_key] = response
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in classification: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Internal classification error")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "GrievAI Classifier"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
