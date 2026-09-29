"""
Simple FastAPI backend runner for testing the intensity estimation feature.
This runs a minimal version without database dependencies.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables for simple mode
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ML_FORCE_STUB"] = "true"
os.environ["CORS_ORIGINS"] = "*"

# Start with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
