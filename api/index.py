"""Vercel Python Serverless Function entrypoint for Kumari Parking FastAPI backend."""

import os
import sys

# Add backend/ to Python path so `from app...` imports resolve cleanly on Vercel
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app  # noqa: E402, F401
