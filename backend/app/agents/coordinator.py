from typing import Dict, Any, List
from .text_agent import text_agent
from .url_agent import url_agent
from .qr_agent import qr_agent
from .audio_agent import audio_agent
from ..rag.vector_store import rag_store

class CoordinatorAgent:
    def __init__(self):
        pass

    def scan_text(self, text: str) -> Dict[str, Any]:
        # Run text analysis
        analysis = text_agent.analyze(text)
        
        # Inject RAG context based on text content
        rag_results = rag_store.search(text, top_k=1)
        recommendation = self._get_rag_recommendation(analysis["verdict"], rag_results)
        
        return {
            "category": "sms_email",
            "risk_score": analysis["risk_score"],
            "verdict": analysis["verdict"],
            "analysis_report": analysis["reasons"],
            "recommendation": recommendation,
            "raw_input": text
        }

    def scan_url(self, url: str) -> Dict[str, Any]:
        # Run URL analysis
        analysis = url_agent.analyze(url)
        
        # Inject RAG context
        rag_results = rag_store.search(url, top_k=1)
        recommendation = self._get_rag_recommendation(analysis["verdict"], rag_results)
        
        return {
            "category": "url",
            "risk_score": analysis["risk_score"],
            "verdict": analysis["verdict"],
            "analysis_report": analysis["reasons"],
            "recommendation": recommendation,
            "raw_input": url
        }

    def scan_qrcode(self, image_bytes: bytes) -> Dict[str, Any]:
        # Run QR analysis
        analysis = qr_agent.analyze(image_bytes)
        
        # Inject RAG context
        # Search RAG with the decoded text or VPA if it was a UPI code
        query_text = " ".join(analysis.get("reasons", []))
        rag_results = rag_store.search(query_text, top_k=1)
        recommendation = self._get_rag_recommendation(analysis["verdict"], rag_results)
        
        return {
            "category": "qrcode",
            "risk_score": analysis["risk_score"],
            "verdict": analysis["verdict"],
            "analysis_report": analysis["reasons"],
            "recommendation": recommendation,
            "raw_input": analysis.get("raw_input", "QR Code Image Upload")
        }

    def scan_voice(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        # Run Audio analysis
        analysis = audio_agent.analyze(audio_bytes, filename)
        
        # Inject RAG context
        query_text = analysis["transcript"] if analysis.get("transcript") else filename
        rag_results = rag_store.search(query_text, top_k=1)
        recommendation = self._get_rag_recommendation(analysis["verdict"], rag_results)
        
        # Incorporate transcript in report
        reasons_list = analysis["reasons"].copy()
        if analysis.get("transcript"):
            reasons_list.insert(0, f"Decoded Transcript: \"{analysis['transcript']}\"")
            
        return {
            "category": "voice",
            "risk_score": analysis["risk_score"],
            "verdict": analysis["verdict"],
            "analysis_report": reasons_list,
            "recommendation": recommendation,
            "raw_input": f"Voice Recording: {filename}"
        }

    def _get_rag_recommendation(self, verdict: str, rag_results: List[Dict[str, Any]]) -> str:
        if verdict == "SAFE":
            return "This input appears secure. No special actions are necessary. Continue to exercise general cybersecurity vigilance."
            
        # Ground recommendation in official RAG source
        if rag_results:
            source_item = rag_results[0]
            prefix = f"Based on official safety advisories from {source_item['source']} concerning '{source_item['title']}':\n"
            return prefix + source_item["content"]
            
        # Fallback general recommendation
        return "Warning: High risk scam pattern detected. Do not share OTPs, click links, scan provided codes, or transfer funds. Report this incident to national cybercrime portal (cybercrime.gov.in) or call the helpline 1930 immediately."

coordinator = CoordinatorAgent()
