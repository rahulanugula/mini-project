import cv2
import numpy as np
from typing import Dict, Any, List
from urllib.parse import urlparse, parse_qs
from .url_agent import url_agent

class QrAgent:
    def __init__(self):
        self.category = "qrcode"

    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        try:
            # Decode image from buffer
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {
                    "risk_score": 0,
                    "verdict": "SAFE",
                    "reasons": ["The file could not be parsed as a valid image."],
                    "summary": "Failed to decode the image file. Ensure it is a valid PNG, JPG, or JPEG."
                }

            # Use OpenCV QR Code Detector
            detector = cv2.QRCodeDetector()
            data, bbox, _ = detector.detectAndDecode(img)
            
            if not data:
                return {
                    "risk_score": 0,
                    "verdict": "SAFE",
                    "reasons": ["No readable QR code found in the image."],
                    "summary": "QR code scanner searched the image but did not detect any QR content."
                }

            # We found a QR Code! Now let's analyze its contents
            payload = data.strip()
            
            # Case 1: UPI payment URI
            if payload.lower().startswith("upi://pay"):
                return self._analyze_upi(payload)
                
            # Case 2: Web URL
            elif payload.lower().startswith(("http://", "https://", "www.")):
                url_scan = url_agent.analyze(payload)
                url_scan["raw_input"] = payload
                url_scan["summary"] = f"QR code redirects to external website: {payload}. " + url_scan["summary"]
                url_scan["reasons"].insert(0, f"QR code redirects to external site: '{payload}'")
                return url_scan
                
            # Case 3: Other text data
            else:
                return {
                    "risk_score": 20,
                    "verdict": "SUSPICIOUS",
                    "reasons": [
                        "Contains plain text instead of a standard URL or payment link.",
                        f"Decoded text: \"{payload}\""
                    ],
                    "summary": f"The QR code contains text data: \"{payload}\". Use caution as scammers may use text QR codes for credentials."
                }

        except Exception as e:
            print(f"QrAgent error: {e}")
            return {
                "risk_score": 50,
                "verdict": "SUSPICIOUS",
                "reasons": [f"Error occurred during QR code image parsing: {str(e)}"],
                "summary": "An error occurred while attempting to parse the QR Code. Ensure the image is clear and try again."
            }

    def _analyze_upi(self, upi_url: str) -> Dict[str, Any]:
        reasons = ["Decoded QR code is a UPI Payment Link."]
        score = 0
        
        try:
            parsed = urlparse(upi_url)
            query_params = parse_qs(parsed.query)
            
            # Extract key UPI parameters
            # pa: payee address (VPA)
            # pn: payee name
            # am: transaction amount
            # tn: transaction note
            pa = query_params.get("pa", [None])[0]
            pn = query_params.get("pn", ["Unknown"])[0]
            am = query_params.get("am", [None])[0]
            tn = query_params.get("tn", ["None"])[0]
            
            reasons.append(f"Payee Name: {pn}")
            reasons.append(f"Payee Address (VPA): {pa}")
            
            if am:
                reasons.append(f"Requested Amount: ₹{am} INR")
                # Pre-filled high amounts in QR codes from strangers are suspicious
                try:
                    amount_float = float(am)
                    if amount_float > 500:
                        reasons.append("QR code requests a significant transaction amount automatically.")
                        score += 35
                except ValueError:
                    pass
            else:
                reasons.append("Requested Amount: Variable (User inputs amount)")

            # Check for suspicious strings in Payee VPA or Note
            scam_keywords = ["lottery", "prize", "refund", "cashback", "double", "free", "admin", "reward", "win", "gift"]
            suspicious_fields = []
            
            for kw in scam_keywords:
                if (pa and kw in pa.lower()) or (pn and kw in pn.lower()) or (tn and kw in tn.lower()):
                    suspicious_fields.append(kw)
            
            if suspicious_fields:
                reasons.append(f"Contains reward/lottery keywords: {', '.join(suspicious_fields)}.")
                score += 50
            
            # Base UPI scam risks
            score += 25  # UPI scans warrant cautionary assessment
            
            # Check for generic VPAs or non-standard hosts
            if pa and not any(host in pa for host in ["@oksbi", "@okhdfcbank", "@okaxis", "@okicici", "@ybl", "@paytm", "@upi", "@barodampay", "@ibl", "@axl"]):
                reasons.append("Uses an unfamiliar or custom Virtual Payment Address (VPA) provider.")
                score += 15
                
            score = min(score, 100)
            
            if score >= 60:
                verdict = "HIGH_RISK"
            elif score >= 25:
                verdict = "SUSPICIOUS"
            else:
                verdict = "SAFE"
                
            summary = f"Decoded UPI payment to '{pn}' ({pa}). "
            if am:
                summary += f"Requests transfer of ₹{am}."
            else:
                summary += "Requests money transfer of variable amount."
            
            return {
                "risk_score": score,
                "verdict": verdict,
                "reasons": reasons,
                "summary": summary
            }

        except Exception as e:
            return {
                "risk_score": 60,
                "verdict": "SUSPICIOUS",
                "reasons": ["Failed to extract clean UPI transaction details.", f"Error: {str(e)}"],
                "summary": "The QR code has a UPI structure but its transaction details are obfuscated, which is suspicious."
            }

qr_agent = QrAgent()
