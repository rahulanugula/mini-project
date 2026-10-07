import sys
import os

# Ensure backend directory is on sys.path for root uvicorn imports
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
