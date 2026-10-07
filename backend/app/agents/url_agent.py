import re
import json
from urllib.parse import urlparse
from typing import Dict, Any, List
from ..config import settings

class UrlAgent:
    def __init__(self):
        self.category = "url"

    def analyze(self, url: str) -> Dict[str, Any]:
        # Pre-process URL to ensure scheme exists
        url_to_check = url.strip()
        if not url_to_check.startswith(("http://", "https://")):
            url_to_check = "http://" + url_to_check

        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    generation_config={"response_mime_type": "application/json"}
                )
                
                prompt = f"""
                You are SENTINEL's URL Security Agent. Analyze the following URL/domain for phishing, malware distribution, fake portals, banking impostors, or suspicious characteristics.
                
                URL to analyze:
                "{url_to_check}"
                
                Respond ONLY with a JSON object containing:
                1. "risk_score": integer between 0 and 100
                2. "verdict": "SAFE", "SUSPICIOUS", or "HIGH_RISK"
                3. "reasons": list of strings detailing why the URL was flagged (e.g., "Uses HTTP instead of HTTPS", "Impersonates SBI domain")
                4. "summary": a brief 1-2 sentence explanation of the URL safety check.
                """
                
                response = model.generate_content(prompt)
                data = json.loads(response.text.strip())
                return {
                    "risk_score": data.get("risk_score", 0),
                    "verdict": data.get("verdict", "SAFE"),
                    "reasons": data.get("reasons", ["Domain appears standard."]),
                    "summary": data.get("summary", "URL scanned successfully.")
                }
            except Exception as e:
                print(f"Gemini UrlAgent failed: {e}. Falling back to heuristics.")

        # Heuristic Fallback
        reasons = []
        score = 0
        
        try:
            parsed = urlparse(url_to_check)
            domain = parsed.netloc.lower()
            scheme = parsed.scheme.lower()
        except Exception:
            return {
                "risk_score": 90,
                "verdict": "HIGH_RISK",
                "reasons": ["Invalid URL format. Appears malformed or disguised."],
                "summary": "The URL format is invalid, suggesting an attempt to evade automated scanners."
            }

        # 1. Check if scheme is HTTP instead of HTTPS
        if scheme == "http":
            reasons.append("Unencrypted connection (HTTP). Modern websites should use secure HTTPS.")
            score += 25

        # 2. Check for suspicious TLDs
        suspicious_tlds = [".xyz", ".club", ".top", ".online", ".site", ".cc", ".ru", ".buzz", ".live", ".work", ".info", ".tk", ".ml", ".cf", ".gq"]
        has_suspicious_tld = False
        for tld in suspicious_tlds:
            if domain.endswith(tld):
                has_suspicious_tld = True
                break
        if has_suspicious_tld:
            reasons.append("Registered under a low-reputation or cheap Top-Level Domain (TLD) frequently used in phishing.")
            score += 30

        # 3. Check for typosquatting / brand impersonation
        brands = ["sbi", "hdfc", "icici", "axis", "paytm", "google", "microsoft", "amazon", "netflix", "facebook", "instagram", "whatsapp", "npc", "yono", "rbi"]
        impersonation_detected = False
        
        # Look for hyphenated brands e.g. hdfc-login, sbi-kyc-update
        for brand in brands:
            # If the brand is in the domain, but the domain is not the official brand site
            # For simplicity, if domain contains brand but doesn't end with brand.com, brand.in, brand.co.in
            official_suffixes = [f"{brand}.com", f"{brand}.in", f"{brand}.co.in", f"{brand}.net", f"{brand}.org"]
            matches_brand = brand in domain
            is_official = any(domain == suffix or domain.endswith("." + suffix) for suffix in official_suffixes)
            
            if matches_brand and not is_official:
                impersonation_detected = True
                reasons.append(f"Contains the brand keyword '{brand.upper()}' but does not resolve to the official domain, indicating impersonation (phishing).")
                score += 45

        # 4. Check for keyword indicators in URL path or subdomain
        scam_keywords = ["kyc", "verify", "login", "secure", "update", "account", "support", "signin", "resolve", "blocked", "bonus", "gift", "refund"]
        found_kw = []
        for kw in scam_keywords:
            if kw in domain or kw in parsed.path.lower():
                found_kw.append(kw)
        if found_kw:
            reasons.append(f"URL contains suspicious security/urgency keywords: {', '.join(found_kw)}.")
            score += 20

        # 5. Check if URL is shortener
        shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly", "adf.ly"]
        is_shortener = any(domain == s or domain.endswith("." + s) for s in shorteners)
        if is_shortener:
            reasons.append("Uses a URL shortener service to hide the final destination link.")
            score += 25

        # 6. Check for ip address domain
        ip_pattern = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
        if ip_pattern.match(domain):
            reasons.append("Uses a raw IP address instead of a domain name, highly typical of malicious servers.")
            score += 50

        # Cap score at 100
        score = min(score, 100)

        if score >= 65:
            verdict = "HIGH_RISK"
        elif score >= 25:
            verdict = "SUSPICIOUS"
        else:
            verdict = "SAFE"
            reasons = ["Domain is standard and displays no apparent phishing characteristics."]

        summary = f"Scanned domain '{domain}'. Risk score of {score}% due to structural analysis flags." if score > 0 else f"No suspicious characteristics identified for '{domain}'."

        return {
            "risk_score": score,
            "verdict": verdict,
            "reasons": reasons,
            "summary": summary
        }

url_agent = UrlAgent()
