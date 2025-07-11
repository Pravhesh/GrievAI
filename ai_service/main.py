from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="GrievAI Classifier", version="0.1.0")

# Zero-shot classifier for quick hackathon demo
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
CANDIDATE_LABELS = [
    "Water",
    "Power",
    "Road",
    "Sanitation",
    "Health",
    "Spam",
]


class ComplaintIn(BaseModel):
    text: str


class ClassificationOut(BaseModel):
    label: str
    score: float


@app.post("/classify", response_model=ClassificationOut)
async def classify(complaint: ComplaintIn):
    """Classify a grievance into a predefined category and detect spam."""
    result = classifier(complaint.text, candidate_labels=CANDIDATE_LABELS, multi_label=False)
    return {
        "label": result["labels"][0],
        "score": float(result["scores"][0]),
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
