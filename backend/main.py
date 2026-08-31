from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import initialize_auth_schema
from backend.routers import auth
from backend.routers import chat
from backend.routers import commodities
from backend.routers import demands
from backend.routers import logistics
from backend.routers import mandis
from backend.routers import orders
from backend.routers import support
from backend.routers import payments
from backend.routers import predictions
from backend.routers import communities

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
app.include_router(support.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(demands.router, prefix="/api")
app.include_router(demands.offer_router, prefix="/api")
app.include_router(logistics.router, prefix="/api")
app.include_router(communities.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.on_event("startup")
def initialize_database_schema():
    initialize_auth_schema()

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
