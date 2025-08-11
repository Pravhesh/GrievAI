import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import time

# Set dummy env vars for testing before importing the app
os.environ['CACHE_TTL_SEC'] = '2'
os.environ['HF_MODEL'] = 'distilbert-base-uncased-finetuned-sst-2-english'

from ai_service.main import app, cache

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_cache_after_test():
    """Fixture to clear the cache after each test."""
    cache.clear()
    yield
    cache.clear()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "GrievAI Classifier"}

def test_classify_empty_text():
    response = client.post("/classify", json={"text": ""})
    assert response.status_code == 400
    assert "Text cannot be empty" in response.json()["detail"]

    response = client.post("/classify", json={"text": "   "})
    assert response.status_code == 400
    assert "Text cannot be empty" in response.json()["detail"]

# Mock the Hugging Face pipeline
@patch('ai_service.main.get_text_classifier')
def test_classify_success_and_cache(mock_get_classifier):
    # Configure the mock
    mock_pipeline = MagicMock()
    mock_pipeline.return_value = {
        'labels': ['Road', 'Water', 'Spam'],
        'scores': [0.9, 0.05, 0.05]
    }
    mock_get_classifier.return_value = mock_pipeline

    # 1. First call - should be a cache miss and call the model
    response1 = client.post("/classify", json={"text": "There is a huge pothole on main street."})
    assert response1.status_code == 200
    json_response1 = response1.json()
    assert json_response1["label"] == "Road"
    assert json_response1["score"] > 0.8
    mock_pipeline.assert_called_once() # Check that the model was called

    # 2. Second call with same text - should be a cache hit
    response2 = client.post("/classify", json={"text": "There is a huge pothole on main street."})
    assert response2.status_code == 200
    json_response2 = response2.json()
    assert json_response1 == json_response2 # Response should be identical
    mock_pipeline.assert_called_once() # Check that the model was NOT called again

    # 3. Call with different text - should be a cache miss
    response3 = client.post("/classify", json={"text": "The water is brown."})
    assert response3.status_code == 200
    assert mock_pipeline.call_count == 2 # Model should be called again

    # 4. Test cache expiry
    time.sleep(3) # Wait for cache TTL (set to 2s) to expire
    response4 = client.post("/classify", json={"text": "There is a huge pothole on main street."})
    assert response4.status_code == 200
    assert mock_pipeline.call_count == 3 # Model should be called again after cache expiry
