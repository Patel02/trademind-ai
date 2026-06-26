import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="TradeMind AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendationRequest(BaseModel):
    health_score: float
    diversification_score: float
    risk_score: float
    sector_allocations: List[dict]

class RecommendationResponse(BaseModel):
    recommendation: str
    priority: str

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    print(f"URL: {request.url.path} STATUS: {response.status_code} TIME: {process_time:.4f}s")
    return response

@app.get("/")
def read_root():
    return {"status": "online", "service": "ai-engine", "version": "1.0.0"}

@app.post("/ai/recommendation", response_model=RecommendationResponse)
def get_recommendation(data: RecommendationRequest):
    # Rule engine to decide recommendations
    priority = "low"
    recommendation = "Portfolio is healthy. Continue tracking allocations."
    
    it_alloc = sum(s.get("allocationPct", 0) for s in data.sector_allocations if s.get("sector") == "IT Services")
    if it_alloc > 40:
        priority = "high"
        recommendation = "High IT concentration detected (>40%). Consider shifting capital to defensive sectors like Consumer Goods or Pharma."
    
    return RecommendationResponse(recommendation=recommendation, priority=priority)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
