import json
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from .config import settings
from .database import engine, Base, get_db, SessionLocal
from .models import ScamReport
from .schemas import (
    ScanTextRequest, ScanUrlRequest, ScanResponse,
    ChatRequest, ChatResponse, ScamReportCreate, ScamReportResponse,
    ThreatStatsResponse
)
from .agents.coordinator import coordinator
from .rag.vector_store import rag_store

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

# Seed database with initial logs if empty to make dashboard look rich and behave dynamically
def seed_database():
    db = SessionLocal()
    try:
        if db.query(ScamReport).count() == 0:
            import json
            from datetime import datetime, timedelta
            
            print("Database is empty. Seeding initial threat logs...")
            mock_reports = [
                # High Risk items (8 items)
                {
                    "category": "sms_email",
                    "input_data": "URGENT: Verify your HDFC credit card reward points immediately by clicking here http://hdfc-bank-rewards-refund.online",
                    "risk_score": 90,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Creates artificial urgency.", "Contains suspicious external URL link."],
                    "recommendation": "Do not open links from unverified numbers. Check HDFC official website."
                },
                {
                    "category": "qrcode",
                    "input_data": "UPI Payment QR code requesting ₹2,000",
                    "risk_score": 80,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["QR Code requests UPI transfer transaction automatically.", "Payee name is generic."],
                    "recommendation": "NPCI: A UPI PIN is only needed to transfer money, never to receive it."
                },
                {
                    "category": "url",
                    "input_data": "http://secure-sbi-netbanking-verify.xyz/login",
                    "risk_score": 95,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Uses unencrypted connection HTTP.", "Suspicious Top-Level Domain (.xyz).", "Impersonates SBI domain."],
                    "recommendation": "CERT-In: Verify official domain endings and avoid entering credentials."
                },
                {
                    "category": "voice",
                    "input_data": "Voice Recording: relative_emergency_scam.wav",
                    "risk_score": 85,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Decoded Transcript: \"Mom! It's me! I'm in trouble. I got arrested...\"", "Voice pitch cloning markers detected.", "High pressure emergency request."],
                    "recommendation": "CERT-In Advisory: Verify emergencies by calling relatives directly on their original number."
                },
                {
                    "category": "sms_email",
                    "input_data": "Your Axis account has been suspended due to pending PAN card re-verification. Update now at http://axis-verify-secure.site",
                    "risk_score": 88,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Bank name impersonation.", "Suspicious TLD '.site'.", "Threatens account suspension."],
                    "recommendation": "Do not respond to SMS requesting PAN/Aadhar updates. Banks never solicit credentials via SMS."
                },
                {
                    "category": "url",
                    "input_data": "http://free-lottery-giftcard-claims.cc",
                    "risk_score": 75,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Low-reputation Top-Level Domain (.cc).", "Offers unrealistic financial returns."],
                    "recommendation": "Ignore fake lottery claims. Do not share banking login details."
                },
                {
                    "category": "qrcode",
                    "input_data": "QR code claiming to offer 'Get ₹1,000 cash back instantly' at paytm-winprize@ybl",
                    "risk_score": 70,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["UPI payment link requesting user authorization.", "VPA contains suspicious keywords ('winprize')."],
                    "recommendation": "NPCI rules: QR codes are only for paying. You do not need to scan a QR code to receive cashback."
                },
                {
                    "category": "sms_email",
                    "input_data": "KBC Lottery Draw: Won ₹25,00,000. Contact director Rana Pratap on WhatsApp +918237248924 to claim.",
                    "risk_score": 92,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Promises fake lottery winnings.", "Uses personal WhatsApp numbers for banking validation."],
                    "recommendation": "Ignore lottery claim requests. Never pay registration fees or charges to claim any prize."
                },
                # Suspicious items (7 items)
                {
                    "category": "url",
                    "input_data": "https://shorturl.at/xTzY9",
                    "risk_score": 50,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Uses a URL shortener service to hide destination link."],
                    "recommendation": "Be cautious when opening shortened URLs. Use redirect checkers to examine the final landing page."
                },
                {
                    "category": "sms_email",
                    "input_data": "Urgent Part-time YouTube liking job! Earn ₹5,000 per day by sitting at home. Contact telegram channel @TaskJobIndia",
                    "risk_score": 60,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Promotes part-time YouTube task scams.", "Requests communication shift to Telegram channels."],
                    "recommendation": "RBI Advisory: Beware of part-time task jobs demanding small deposits to unlock payouts. They are Ponzi schemes."
                },
                {
                    "category": "voice",
                    "input_data": "Voice Recording: bank_kyc_robocall.wav",
                    "risk_score": 65,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Decoded Transcript: \"Attention customer, your account registration has expired. Press 9...\"", "Robotic TTS synthesis markers."],
                    "recommendation": "Hang up robocalls requesting UPI/OTP verification. Call your bank branch directly."
                },
                {
                    "category": "qrcode",
                    "input_data": "UPI Merchant scan test for food ordering: checkout@okhdfcbank requesting variable amount",
                    "risk_score": 35,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["UPI Payment link detected.", "Requests money transfer without predefined payee verification records."],
                    "recommendation": "Verify payment merchant name shown on app matches the shop name before typing PIN."
                },
                {
                    "category": "sms_email",
                    "input_data": "Your Amazon parcel could not be delivered due to incorrect street number. Verify details here http://amazon-helper-courier.xyz",
                    "risk_score": 68,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Impersonates delivery services.", "Contains suspicious link with '.xyz' suffix."],
                    "recommendation": "Verify tracking ID on official courier website. Do not follow SMS details page links."
                },
                {
                    "category": "url",
                    "input_data": "https://192.168.10.45:8080/portal/login",
                    "risk_score": 45,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Uses local private IP address, which is anomalous for public portals."],
                    "recommendation": "Do not enter login credentials on IP based URLs unless resolving to local network targets."
                },
                {
                    "category": "sms_email",
                    "input_data": "Earn passive income by investing ₹200 and getting ₹1,000 back daily. Contact support.",
                    "risk_score": 55,
                    "verdict": "SUSPICIOUS",
                    "analysis_report": ["Promises high, guaranteed returns with minimal active involvement."],
                    "recommendation": "RBI warning: Avoid unregulated investment programs encouraging network referrals or fees."
                },
                # Safe items (10 items)
                {
                    "category": "url",
                    "input_data": "https://google.com",
                    "risk_score": 5,
                    "verdict": "SAFE",
                    "analysis_report": ["Standard HTTPS protocol.", "Well-known high-reputation domain."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "url",
                    "input_data": "https://github.com",
                    "risk_score": 0,
                    "verdict": "SAFE",
                    "analysis_report": ["Official secure SSL Certificate.", "Standard web protocol resolved."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "sms_email",
                    "input_data": "Dear customer, your statement for credit card ending in 4059 is generated. Total due: ₹3,400. Pay by 15th July.",
                    "risk_score": 8,
                    "verdict": "SAFE",
                    "analysis_report": ["Informational banking notification.", "No links or urgent credentials requested."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "qrcode",
                    "input_data": "QR code: safe_upi_qr.png resolving to localstore@oksbi",
                    "risk_score": 10,
                    "verdict": "SAFE",
                    "analysis_report": ["Decoded UPI payments VPA resolves to popular oksbi handle.", "Payee name matches verified merchant Supermarket."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "voice",
                    "input_data": "Voice Recording: friend_social_call.wav",
                    "risk_score": 12,
                    "verdict": "SAFE",
                    "analysis_report": ["Decoded Transcript: \"Hey, just calling to confirm we are still on for lunch...\"", "Natural conversational pitch fluctuations."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "sms_email",
                    "input_data": "Your OTP for registering on the National Cybercrime Portal is 738492. Valid for 10 minutes. Do not share.",
                    "risk_score": 15,
                    "verdict": "SAFE",
                    "analysis_report": ["Standard OTP transactional notification.", "No scam language detected."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "url",
                    "input_data": "https://wikipedia.org",
                    "risk_score": 2,
                    "verdict": "SAFE",
                    "analysis_report": ["Standard secure connections.", "Publicly indexed knowledge base."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "sms_email",
                    "input_data": "Hi! Can you send me the slides for the meeting tomorrow morning? Thanks, Raj.",
                    "risk_score": 0,
                    "verdict": "SAFE",
                    "analysis_report": ["Safe conversational team email."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "qrcode",
                    "input_data": "QR code: safe_url_qr.png resolving to https://google.com",
                    "risk_score": 5,
                    "verdict": "SAFE",
                    "analysis_report": ["Decoded URL redirects to secure high reputation search system google.com."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                },
                {
                    "category": "url",
                    "input_data": "http://127.0.0.1:8000/docs",
                    "risk_score": 10,
                    "verdict": "SAFE",
                    "analysis_report": ["Resolves to localhost development server documentation portal."],
                    "recommendation": "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
                }
            ]
            
            for idx, r in enumerate(mock_reports):
                # Distribute creation dates slightly in past to simulate logs
                created_date = datetime.utcnow() - timedelta(hours=(idx * 2))
                db_report = ScamReport(
                    category=r["category"],
                    input_data=r["input_data"],
                    risk_score=r["risk_score"],
                    verdict=r["verdict"],
                    analysis_report=json.dumps(r["analysis_report"]),
                    recommendation=r["recommendation"],
                    created_at=created_date
                )
                db.add(db_report)
            db.commit()
            print("Successfully seeded 25 threat feed reports!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_database()

app = FastAPI(title=settings.PROJECT_NAME)

# CORS setup for frontend local server connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "project": settings.PROJECT_NAME, "version": "1.0.0"}

# Scan SMS/Email endpoint
@app.post("/api/scan/text", response_model=ScanResponse)
def scan_text(request: ScanTextRequest, db: Session = Depends(get_db)):
    try:
        result = coordinator.scan_text(request.text)
        
        # Save scan history to database
        db_report = ScamReport(
            category=result["category"],
            input_data=result["raw_input"],
            risk_score=result["risk_score"],
            verdict=result["verdict"],
            analysis_report=json.dumps(result["analysis_report"]),
            recommendation=result["recommendation"]
        )
        db.add(db_report)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text scanning failed: {str(e)}"
        )

# Scan URL endpoint
@app.post("/api/scan/url", response_model=ScanResponse)
def scan_url(request: ScanUrlRequest, db: Session = Depends(get_db)):
    try:
        result = coordinator.scan_url(request.url)
        
        # Save scan history
        db_report = ScamReport(
            category=result["category"],
            input_data=result["raw_input"],
            risk_score=result["risk_score"],
            verdict=result["verdict"],
            analysis_report=json.dumps(result["analysis_report"]),
            recommendation=result["recommendation"]
        )
        db.add(db_report)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"URL scanning failed: {str(e)}"
        )

# Scan QR Code image upload endpoint
@app.post("/api/scan/qrcode", response_model=ScanResponse)
async def scan_qrcode(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        result = coordinator.scan_qrcode(content)
        
        # Save scan history
        db_report = ScamReport(
            category=result["category"],
            input_data=result["raw_input"],
            risk_score=result["risk_score"],
            verdict=result["verdict"],
            analysis_report=json.dumps(result["analysis_report"]),
            recommendation=result["recommendation"]
        )
        db.add(db_report)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QR Code scanning failed: {str(e)}"
        )

# Scan Voice recording upload endpoint
@app.post("/api/scan/voice", response_model=ScanResponse)
async def scan_voice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        filename = file.filename
        content = await file.read()
        result = coordinator.scan_voice(content, filename)
        
        # Save scan history
        db_report = ScamReport(
            category=result["category"],
            input_data=result["raw_input"],
            risk_score=result["risk_score"],
            verdict=result["verdict"],
            analysis_report=json.dumps(result["analysis_report"]),
            recommendation=result["recommendation"]
        )
        db.add(db_report)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio scanning failed: {str(e)}"
        )

# RAG Chatbot advisor endpoint
@app.post("/api/chat", response_model=ChatResponse)
def chatbot_advisor(request: ChatRequest):
    try:
        query = request.message
        
        # Retrieve context from vector store
        context_chunks = rag_store.search(query, top_k=2)
        sources = [c["source"] for c in context_chunks]
        
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")
                
                context_str = "\n\n".join([f"Source: {c['source']} ({c['title']})\nContent: {c['content']}" for c in context_chunks])
                prompt = f"""
                You are SENTINEL's expert Cybersecurity Advisor chatbot. Your purpose is to advise citizens on avoiding online banking, UPI, KYC, job, and QR code scams.
                
                Guidelines:
                - Use the provided context from trusted cybersecurity advisories (CERT-In, RBI, NPCI) to ground your answer.
                - Keep your tone supportive, authoritative, and direct.
                - Give clear action steps.
                
                Official context:
                {context_str}
                
                Conversation history:
                {request.history}
                
                User question:
                "{query}"
                
                Provide a clear and concise reply based on the official guidelines:
                """
                response = model.generate_content(prompt)
                return ChatResponse(answer=response.text.strip(), sources=sources)
            except Exception as e:
                print(f"Gemini Chat failed: {e}. Falling back to rule-based chat.")

        # Heuristic fallback chatbot response
        if context_chunks:
            primary = context_chunks[0]
            answer = f"According to official advisories from {primary['source']} on '{primary['title']}':\n\n{primary['content']}\n\nKey Action Step: Do not share credentials, OTPs, or scan unknown QR codes. Immediately call the national helpline 1930 if you have lost money."
        else:
            answer = "I'm Sentinel's Cybersecurity Guard. For your safety, remember: no bank or official authority will ever ask you for your passwords, card PINs, or UPI PINs. PINs are only used to send money, never to receive it. Please contact your bank directly if you suspect suspicious activity."
            
        return ChatResponse(answer=answer, sources=sources)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat adviser failed: {str(e)}"
        )

# Fetch dashboard statistics and logs
@app.get("/api/stats", response_model=ThreatStatsResponse)
def get_threat_stats(db: Session = Depends(get_db)):
    try:
        reports = db.query(ScamReport).all()
        
        total_scans = len(reports)
        safe_count = sum(1 for r in reports if r.verdict == "SAFE")
        suspicious_count = sum(1 for r in reports if r.verdict == "SUSPICIOUS")
        high_risk_count = sum(1 for r in reports if r.verdict == "HIGH_RISK")
        
        # Category distribution
        categories = ["sms_email", "url", "qrcode", "voice"]
        cat_dist = {cat: sum(1 for r in reports if r.category == cat) for cat in categories}
        
        # Recent feed logs
        recent_db = db.query(ScamReport).order_by(ScamReport.id.desc()).limit(10).all()
        recent_feed = []
        for r in recent_db:
            try:
                anal_rep = json.loads(r.analysis_report)
            except Exception:
                anal_rep = [r.analysis_report]
            recent_feed.append({
                "id": r.id,
                "category": r.category,
                "input_data": r.input_data[:60] + "..." if r.input_data and len(r.input_data) > 60 else r.input_data,
                "risk_score": r.risk_score,
                "verdict": r.verdict,
                "analysis_report": anal_rep,
                "recommendation": r.recommendation,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        # Add pre-seeded mock stats if database is brand new, to make dashboard look rich immediately
        if total_scans == 0:
            total_scans = 25
            safe_count = 10
            suspicious_count = 7
            high_risk_count = 8
            cat_dist = {"sms_email": 8, "url": 9, "qrcode": 5, "voice": 3}
            recent_feed = [
                {
                    "id": 1,
                    "category": "sms_email",
                    "input_data": "URGENT: Verify your HDFC credit card reward points immediately by clicking here...",
                    "risk_score": 90,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Creates artificial urgency.", "Contains suspicious external URL link."],
                    "recommendation": "Do not open links from unverified numbers. Check HDFC official website.",
                    "created_at": "Just now"
                },
                {
                    "id": 2,
                    "category": "qrcode",
                    "input_data": "UPI Payment QR code requesting ₹2,000",
                    "risk_score": 80,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["QR Code requests UPI transfer transaction automatically.", "Payee name is generic."],
                    "recommendation": "NPCI: A UPI PIN is only needed to transfer money, never to receive it.",
                    "created_at": "5 mins ago"
                },
                {
                    "id": 3,
                    "category": "url",
                    "input_data": "http://secure-sbi-netbanking-verify.xyz/login",
                    "risk_score": 95,
                    "verdict": "HIGH_RISK",
                    "analysis_report": ["Uses unencrypted connection HTTP.", "Suspicious Top-Level Domain (.xyz).", "Impersonates SBI domain."],
                    "recommendation": "CERT-In: Verify official domain endings and avoid entering credentials.",
                    "created_at": "20 mins ago"
                }
            ]

        return ThreatStatsResponse(
            total_scans=total_scans,
            safe_count=safe_count,
            suspicious_count=suspicious_count,
            high_risk_count=high_risk_count,
            category_distribution=cat_dist,
            recent_reports=recent_feed
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )

# Community report post endpoint
@app.post("/api/reports", response_model=ScamReportResponse)
def create_community_report(report: ScamReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = ScamReport(
            category=report.category,
            input_data=report.input_data,
            risk_score=report.risk_score,
            verdict=report.verdict,
            analysis_report=json.dumps(report.analysis_report),
            recommendation=report.recommendation
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report creation failed: {str(e)}"
        )
