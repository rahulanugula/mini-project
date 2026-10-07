import os
import json
import numpy as np
from typing import List, Dict, Any
from ..config import settings

class RAGVectorStore:
    def __init__(self):
        self.kb_file = os.path.join(os.path.dirname(__file__), "kb_data.json")
        self.kb_items: List[Dict[str, Any]] = []
        self.embeddings: Dict[str, List[float]] = {}
        self.load_kb()
        self.initialize_embeddings()

    def load_kb(self):
        try:
            with open(self.kb_file, "r") as f:
                self.kb_items = json.load(f)
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
            self.kb_items = []

    def initialize_embeddings(self):
        # Only initialize vector embeddings if GEMINI_API_KEY is available
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                print("Gemini API Key detected. Pre-embedding RAG Knowledge Base...")
                for item in self.kb_items:
                    text_to_embed = f"{item['title']}\n{item['content']}"
                    response = genai.embed_content(
                        model="models/text-embedding-004",
                        contents=text_to_embed,
                        task_type="retrieval_document"
                    )
                    self.embeddings[item['id']] = response['embedding']
                print("RAG Knowledge Base embedded successfully!")
            except Exception as e:
                print(f"Failed to embed RAG KB: {e}. Defaulting to keyword search.")
                self.embeddings = {}

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        if not self.kb_items:
            return []

        # If we have live embeddings, perform semantic search
        if settings.GEMINI_API_KEY and self.embeddings:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                query_response = genai.embed_content(
                    model="models/text-embedding-004",
                    contents=query,
                    task_type="retrieval_query"
                )
                query_vec = np.array(query_response['embedding'])
                
                scores = []
                for item in self.kb_items:
                    if item['id'] in self.embeddings:
                        doc_vec = np.array(self.embeddings[item['id']])
                        # Cosine similarity
                        similarity = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec))
                        scores.append((item, similarity))
                
                # Sort by similarity score descending
                scores.sort(key=lambda x: x[1], reverse=True)
                return [item for item, score in scores[:top_k]]
            except Exception as e:
                print(f"Error during semantic RAG search: {e}. Falling back to keyword search.")

        # Fallback keyword overlap search
        query_words = set(query.lower().split())
        scored_items = []
        
        for item in self.kb_items:
            score = 0
            # Title matches score more
            title_words = set(item['title'].lower().split())
            content_words = set(item['content'].lower().split())
            keyword_list = [k.lower() for k in item.get('keywords', [])]
            
            # Count word matches
            score += len(query_words.intersection(title_words)) * 3.0
            score += len(query_words.intersection(content_words)) * 1.0
            
            # Count keyword matches
            for kw in keyword_list:
                if kw in query.lower():
                    score += 4.0
            
            scored_items.append((item, score))
            
        # Sort by score descending and return those with score > 0 (or all if none match)
        scored_items.sort(key=lambda x: x[1], reverse=True)
        
        # If no items got a positive score, just return the first few entries
        if scored_items[0][1] == 0:
            return self.kb_items[:top_k]
            
        return [item for item, score in scored_items[:top_k]]

rag_store = RAGVectorStore()
