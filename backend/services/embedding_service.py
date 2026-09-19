import os
import math
import re
import hashlib
import requests
from config import settings

EMBEDDING_DIM = 1536

def generate_embedding(text: str) -> list[float]:
    """
    Transforms text into a 1536-dimensional normalized vector embedding.
    Uses OpenAI/Gemini API when available, otherwise uses a semantic feature vectorizer fallback.
    """
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM

    clean_text = text.strip().lower()

    # 1. Try OpenAI Embeddings API
    if settings.OPENAI_API_KEY:
        try:
            return _openai_embedding(clean_text)
        except Exception as e:
            print(f"OpenAI embedding error ({e}). Using semantic vectorizer fallback.")

    # 2. Try Gemini Embeddings API
    if settings.GEMINI_API_KEY:
        try:
            return _gemini_embedding(clean_text)
        except Exception as e:
            print(f"Gemini embedding error ({e}). Using semantic vectorizer fallback.")

    # 3. High-Quality Semantic Feature Vectorizer Fallback
    return _semantic_hash_embedding(clean_text)

def _openai_embedding(text: str) -> list[float]:
    url = "https://api.openai.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "text-embedding-3-small",
        "input": text
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    resp.raise_for_request()
    data = resp.json()
    return data["data"][0]["embedding"]

def _gemini_embedding(text: str) -> list[float]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "content": {"parts": [{"text": text}]}
    }
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_request()
    data = resp.json()
    raw_vec = data["embedding"]["values"]
    # Resize or pad to 1536 dimensions
    if len(raw_vec) < EMBEDDING_DIM:
        raw_vec += [0.0] * (EMBEDDING_DIM - len(raw_vec))
    elif len(raw_vec) > EMBEDDING_DIM:
        raw_vec = raw_vec[:EMBEDDING_DIM]
    return _normalize_vector(raw_vec)

def _semantic_hash_embedding(text: str) -> list[float]:
    """
    Deterministic 1536-dim semantic feature vectorizer using domain concept mapping
    and sub-word n-gram feature hashing with L2 normalization.
    """
    vec = [0.0] * EMBEDDING_DIM

    # Operational domain concept weightings to ensure high cosine similarity for related terms
    domain_concepts = {
        # Database & Pool domain
        ("postgres", "postgresql", "database", "sql", "pool", "max_connections", "pgbouncer", "connection", "exhausted", "capacity", "session", "lock"): [0, 1, 2, 3, 4, 5, 6, 7],
        # Cache domain
        ("redis", "cache", "eviction", "memcached", "stampede", "thundering", "lru", "hit ratio", "ttl"): [10, 11, 12, 13, 14, 15],
        # Auth domain
        ("jwt", "auth", "auth0", "token", "sso", "jwks", "401", "unauthorized", "signature", "key"): [20, 21, 22, 23, 24],
        # Kafka & Streaming domain
        ("kafka", "lag", "consumer", "partition", "topic", "streaming", "backpressure", "rebalance"): [30, 31, 32, 33, 34],
        # K8s & Memory OOM domain
        ("k8s", "kubernetes", "pod", "oom", "oomkilled", "memory", "exit code 137", "crashloop"): [40, 41, 42, 43, 44],
        # Ingress & SSL domain
        ("ingress", "nginx", "ssl", "tls", "cert", "certificate", "dns", "504", "gateway", "handshake"): [50, 51, 52, 53, 54],
        # Payment domain
        ("stripe", "payment", "checkout", "transaction", "fintech", "card", "3ds", "webhook"): [60, 61, 62, 63, 64],
        # Storage domain
        ("s3", "bucket", "aws", "storage", "upload", "slowdown", "503", "iam", "prefix"): [70, 71, 72, 73],
    }

    # Apply domain concept boosts
    for keywords, indices in domain_concepts.items():
        if any(kw in text for kw in keywords):
            for idx in indices:
                vec[idx] += 3.5

    # Apply sub-word n-gram feature hashing across remaining 1500 dimensions
    words = re.findall(r'\w+', text)
    for word in words:
        # Hash word to vector index range [100, 1535]
        h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = 100 + (h % (EMBEDDING_DIM - 100))
        val = 1.0 if (h % 2 == 0) else -1.0
        vec[idx] += val

    return _normalize_vector(vec)

def _normalize_vector(vec: list[float]) -> list[float]:
    """Normalize vector to unit length (L2 norm = 1.0)."""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return [0.0] * len(vec)
    return [round(x / norm, 6) for x in vec]

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Computes cosine similarity score (between 0.0 and 1.0) between two vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot_product / (norm_a * norm_b)
    # Clamp between 0.0 and 1.0
    return max(0.0, min(1.0, round(similarity, 4)))
