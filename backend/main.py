from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import commodities, mandis, predictions, orders

app = FastAPI(
    title="KisanSetu (किसानसेतु) Agri-Market API",
    description="Backend Intelligence & Trade Enablement Engine for Farmer-Buyer Linkages, APMC Price Discovery, and Escrow Settlements.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api prefix
app.include_router(commodities.router, prefix="/api")
app.include_router(mandis.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(orders.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to KisanSetu API Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "KisanSetu FastAPI Backend",
        "ml_engine": "online",
        "data_store": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
