from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base

class ScamReport(Base):
    __tablename__ = "scam_reports"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)           # "sms", "email", "url", "qrcode", "voice"
    input_data = Column(Text, nullable=True)         # Plaint text scanned or file name
    risk_score = Column(Integer)                     # 0 to 100
    verdict = Column(String)                        # "SAFE", "SUSPICIOUS", "HIGH_RISK"
    analysis_report = Column(Text)                  # JSON string containing bulleted analysis points
    recommendation = Column(Text)                   # RAG cybersecurity instructions
    created_at = Column(DateTime, default=datetime.utcnow)
