import re
import json
from typing import Dict, Any, List
from ..config import settings

class TextAgent:
    def __init__(self):
        self.category = "sms_email"

    def analyze(self, text: str) -> Dict[str, Any]:
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    generation_config={"response_mime_type": "application/json"}
                )
                
                prompt = f"""
                You are SENTINEL's Text Security Agent. Analyze the following SMS or email text for scams, phishing, spam, fake job offers, banking fraud, lottery scams, or social engineering.
                
                Text to analyze:
                "{text}"
                
                Respond ONLY with a JSON object containing:
                1. "risk_score": integer between 0 and 100
                2. "verdict": "SAFE", "SUSPICIOUS", or "HIGH_RISK"
                3. "reasons": list of strings outlining specific scam indicators found (e.g., "Contains suspicious links", "Creates artificial urgency")
                4. "summary": a brief 1-2 sentence explanation of the assessment.
                """
                
                response = model.generate_content(prompt)
                data = json.loads(response.text.strip())
                return {
                    "risk_score": data.get("risk_score", 0),
                    "verdict": data.get("verdict", "SAFE"),
                    "reasons": data.get("reasons", ["No scam indicators found."]),
                    "summary": data.get("summary", "Analysis completed successfully.")
                }
            except Exception as e:
                print(f"Gemini TextAgent failed: {e}. Falling back to heuristics.")

        # Heuristic Fallback
        reasons = []
        score = 0
        
        # Check Urgency
        urgency_regex = re.compile(
            r"\b(urgent|immediate|immediately|blocked|suspended|expire|expires|action required|today|last chance|verify now|unauthorized)\b", 
            re.IGNORECASE
        )
        if urgency_regex.search(text):
            reasons.append("Creates artificial urgency or panic (e.g. account suspension warnings).")
            score += 35

        # Check Bank impersonation
        bank_regex = re.compile(
            r"\b(sbi|hdfc|icici|axis|pnb|kyc|re-kyc|pan card|adhaar|netbanking|otps?)\b", 
            re.IGNORECASE
        )
        if bank_regex.search(text):
            reasons.append("Impersonates banking or regulatory communications requesting identity details.")
            score += 25

        # Check money/winnings/claims
        money_regex = re.compile(
            r"\b(won|win|prize|lottery|crore|lakh|cashback|gift|credited|reward|bonus|lottery|draw|claim)\b", 
            re.IGNORECASE
        )
        if money_regex.search(text):
            reasons.append("Promises unrealistic financial rewards, lottery winnings, or unexpected cashbacks.")
            score += 30

        # Check jobs
        job_regex = re.compile(
            r"\b(job|part-time|salary|earn|work from home|telegram task|daily income|investment)\b", 
            re.IGNORECASE
        )
        if job_regex.search(text):
            reasons.append("Promotes typical 'part-time task' job offers or daily income schemes.")
            score += 20

        # Check links
        link_regex = re.compile(r"https?://[^\s]+|\bwww\.[^\s]+")
        if link_regex.search(text):
            reasons.append("Contains unverified links pointing to external domains.")
            score += 15

        # Cap score at 100
        score = min(score, 100)
        
        if score >= 70:
            verdict = "HIGH_RISK"
        elif score >= 30:
            verdict = "SUSPICIOUS"
        else:
            verdict = "SAFE"
            reasons = ["No notable scam indicators or security flags detected."]
            
        summary = f"Identified potential scam patterns with a risk score of {score}%." if score > 0 else "The message appears to be safe and clean."
        
        return {
            "risk_score": score,
            "verdict": verdict,
            "reasons": reasons,
            "summary": summary
        }

text_agent = TextAgent()
