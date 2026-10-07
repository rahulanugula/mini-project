from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

class ScanTextRequest(BaseModel):
    text: str

class ScanUrlRequest(BaseModel):
    url: str

class ScanResponse(BaseModel):
    category: str
    risk_score: int
    verdict: str
    analysis_report: List[str]
    recommendation: str
    raw_input: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

class ScamReportCreate(BaseModel):
    category: str
    input_data: str
    risk_score: int
    verdict: str
    analysis_report: List[str]
    recommendation: str

class ScamReportResponse(BaseModel):
    id: int
    category: str
    input_data: Optional[str] = None
    risk_score: int
    verdict: str
    analysis_report: str  # JSON String or string
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True

class ThreatStatsResponse(BaseModel):
    total_scans: int
    safe_count: int
    suspicious_count: int
    high_risk_count: int
    category_distribution: Dict[str, int]
    recent_reports: List[Dict[str, Any]]
