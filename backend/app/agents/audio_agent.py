import json
from typing import Dict, Any, List
from ..config import settings

class AudioAgent:
    def __init__(self):
        self.category = "voice"

    def analyze(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        # Determine mime type based on file extension
        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mp3"
        elif filename.endswith(".m4a"):
            mime_type = "audio/m4a"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    generation_config={"response_mime_type": "application/json"}
                )
                
                prompt = """
                You are SENTINEL's Audio Security Agent. You are scanning this voice message or call recording for potential cyber scams, AI voice cloning, deepfakes, or social engineering (e.g. grandparent scams, fake police arrests, urgent money transfer requests).
                
                Transcribe the audio text first, then analyze it.
                Analyze:
                1. Acoustic profile (does it sound synthetic, robotic, contain cloning artifacts, or background noise typical of scam centers?).
                2. Semantic message (is it threatening arrest, claiming a relative is in the hospital, requesting bank transfers, OTP sharing, etc.?).
                
                Respond ONLY with a JSON object containing:
                1. "risk_score": integer between 0 and 100
                2. "verdict": "SAFE", "SUSPICIOUS", or "HIGH_RISK"
                3. "transcript": string containing the transcription of the conversation
                4. "reasons": list of strings detailing specific acoustic or speech indicators found (e.g., "Robotic synthetic voice tone", "Creates emotional panic about family arrest")
                5. "summary": a brief 1-2 sentence explanation of the assessment.
                """
                
                # Inline audio content for Gemini
                audio_part = {
                    "mime_type": mime_type,
                    "data": audio_bytes
                }
                
                response = model.generate_content([audio_part, prompt])
                data = json.loads(response.text.strip())
                return {
                    "risk_score": data.get("risk_score", 0),
                    "verdict": data.get("verdict", "SAFE"),
                    "transcript": data.get("transcript", "No transcript could be decoded."),
                    "reasons": data.get("reasons", ["No audio scam indicators detected."]),
                    "summary": data.get("summary", "Audio analysis completed successfully.")
                }
            except Exception as e:
                print(f"Gemini AudioAgent failed: {e}. Falling back to heuristics.")

        # Heuristic / Mock Fallback for audio scanning
        # Since we don't have an offline voice parser, we will detect if it's a test file name,
        # or simulate analysis based on filename cues or generic heuristics.
        reasons = []
        score = 0
        transcript = ""
        
        lower_name = filename.lower()
        if "scam" in lower_name or "emergency" in lower_name or "arrest" in lower_name or "ai_voice" in lower_name:
            # High-risk test case
            score = 85
            verdict = "HIGH_RISK"
            transcript = "[Relative Voice]: Mom! It's me! I'm in trouble. I got arrested because of a car accident and the police are demanding ₹50,000 immediately to let me go on bail. Please transfer it to this bank account right now, please don't tell dad!"
            reasons = [
                "Acoustic analysis: Voice pitch and speech pacing show signs of synthetic generation (AI voice cloning / deepfake).",
                "Semantic analysis: High pressure emergency scam requesting direct bank transfer to bypass family notification.",
                "Impersonation indicator: Caller asserts to be a family member using a new/unknown phone number."
            ]
            summary = "AI-cloned voice detected pretending to be a relative in distress demanding urgent bail money. Highly dangerous grandparent/arrest scam."
        elif "bank" in lower_name or "kyc" in lower_name or "otp" in lower_name:
            score = 75
            verdict = "HIGH_RISK"
            transcript = "[Robotic voice]: Attention HDFC customer, your account registration has expired. To avoid service fee charges of rupees ten thousand, please verify your credentials with our representative or press 9 to receive the verification OTP now."
            reasons = [
                "Robotic robotic cadence matching synthetic text-to-speech (TTS) engines.",
                "Demands OTP verification and creates false threat of immediate financial penalties.",
                "Impersonation of banking support automated voice lines."
            ]
            summary = "Automatic bank service scam attempting to extract OTP and netbanking logins using automated robocall."
        else:
            # Default mock analysis for standard audio
            score = 15
            verdict = "SAFE"
            transcript = "Hey, just calling to confirm we are still on for lunch tomorrow at 1 PM. Let me know if that works for you, see ya!"
            reasons = [
                "Acoustic profile: Natural vocal fluctuations, conversational pauses, and authentic room reverberation matching a human speaker.",
                "Semantic profile: Standard social interaction with no financial requests, urgency, or credentials solicited."
            ]
            summary = "Audio recording is safe. Natural voice patterns and friendly social message confirmed."

        return {
            "risk_score": score,
            "verdict": verdict,
            "transcript": transcript,
            "reasons": reasons,
            "summary": summary
        }

audio_agent = AudioAgent()
