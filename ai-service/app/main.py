from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as api_router

def create_app() -> FastAPI:
    app = FastAPI(title="AI Plant Protection Service")

    # Allow CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router, prefix="/api")

    # Key verification log (safe)
    from .core.config import settings
    if settings.gemini_api_key:
        last_4 = settings.gemini_api_key[-4:]
        print(f"🚀 AI Server starting... Gemini Key verified: ****{last_4}")
    else:
        print("⚠️ AI Server starting... WARNING: No Gemini API Key found!")

    return app

app = create_app()
