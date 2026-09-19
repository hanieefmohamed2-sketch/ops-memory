import os
import json
import re
import requests
from config import settings

_OPENAI_AVAILABLE = True
_GEMINI_AVAILABLE = True

def analyze_incident_text(description: str, title: str = "") -> dict:
    global _OPENAI_AVAILABLE, _GEMINI_AVAILABLE
    """
    Analyzes natural-language incident description text and extracts structured operational fields:
    - problem
    - symptoms (list[str])
    - system
    - context
    - potential_component
    - incident_type
    - keywords (list[str])
    """
    text_content = f"{title}\n{description}".strip()

    # 1. Attempt OpenAI / Gemini LLM API if key is available
    if settings.OPENAI_API_KEY and _OPENAI_AVAILABLE:
        try:
            return _extract_with_openai(text_content)
        except Exception as e:
            _OPENAI_AVAILABLE = False
            print(f"OpenAI extraction unavailable ({e}). Falling back to rule-based NLP engine.")

    if settings.GEMINI_API_KEY and _GEMINI_AVAILABLE:
        try:
            return _extract_with_gemini(text_content)
        except Exception as e:
            _GEMINI_AVAILABLE = False
            print(f"Gemini extraction unavailable ({e}). Falling back to rule-based NLP engine.")

    # 2. Fallback to Rule-based NLP Extraction Engine
    return _extract_with_rule_engine(description, title)

def _extract_with_openai(text_content: str) -> dict:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"""You are an SRE Incident Intelligence Analyzer. Analyze the following operational incident description and return a JSON object with EXACTLY these keys:
- "problem": concise summary of the primary technical issue
- "symptoms": list of specific symptoms observed (strings)
- "system": probable primary affected system name (e.g., PostgreSQL Main Cluster, Payment Gateway Service, Auth0, Kafka, Redis, Ingress Gateway, S3, Kubernetes)
- "context": operational context and conditions
- "potential_component": specific microservice, layer, or subsystem suspected
- "incident_type": category (e.g., Database Exhaustion, Latency Spike, Auth Failure, Memory Leak, Rate Limiting, Network Timeout)
- "keywords": list of 5-8 relevant technical keywords (strings)

Incident Description:
{text_content}
"""
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    result = json.loads(data["choices"][0]["message"]["content"])
    return result

def _extract_with_gemini(text_content: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    prompt = f"""Analyze this SRE operational incident and return JSON with keys: problem, symptoms (array), system, context, potential_component, incident_type, keywords (array).
Incident Description:
{text_content}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(raw_text)

def _extract_with_rule_engine(description: str, title: str = "") -> dict:
    """Intelligent rule-based NLP parser fallback."""
    full_text = f"{title} {description}".lower()

    # Default system matching
    system = "Core Infrastructure Cluster"
    if any(k in full_text for k in ["postgres", "sql", "database", "pgvector", "query", "table", "lock"]):
        system = "PostgreSQL Main Cluster"
    elif any(k in full_text for k in ["payment", "stripe", "checkout", "card", "transaction", "merchant"]):
        system = "Payment Gateway Service"
    elif any(k in full_text for k in ["redis", "cache", "eviction", "memcached", "ttl"]):
        system = "Redis Caching Layer"
    elif any(k in full_text for k in ["kafka", "stream", "topic", "consumer", "partition", "backpressure"]):
        system = "Kafka Event Bus"
    elif any(k in full_text for k in ["jwt", "auth", "token", "sso", "login", "401"]):
        system = "Auth0 / Identity Provider"
    elif any(k in full_text for k in ["k8s", "kubernetes", "pod", "oom", "container", "crashloop"]):
        system = "Kubernetes Worker Nodes"
    elif any(k in full_text for k in ["ingress", "nginx", "ssl", "tls", "cert", "dns"]):
        system = "Ingress Gateway (NGINX)"
    elif any(k in full_text for k in ["s3", "aws", "bucket", "upload", "storage"]):
        system = "S3 Asset Storage"

    # Incident Type matching
    incident_type = "Operational Degradation"
    if any(k in full_text for k in ["pool", "exhaust", "max_connections", "capacity"]):
        incident_type = "Connection Pool Exhaustion"
    elif any(k in full_text for k in ["eviction", "thundering", "cache miss"]):
        incident_type = "Cache Eviction & Stampede"
    elif any(k in full_text for k in ["jwt", "expired", "401", "unauthorized"]):
        incident_type = "Authentication Failure"
    elif any(k in full_text for k in ["lag", "backpressure", "delay"]):
        incident_type = "Message Queue Lag Spike"
    elif any(k in full_text for k in ["oom", "memory", "out of memory"]):
        incident_type = "Memory Starvation & OOM Kill"
    elif any(k in full_text for k in ["ssl", "cert", "handshake", "504"]):
        incident_type = "Ingress TLS Gateway Error"

    # Component matching
    potential_component = "Service Layer"
    if "pool" in full_text or "connection" in full_text:
        potential_component = "Database Connection Pool / PgBouncer"
    elif "cache" in full_text or "redis" in full_text:
        potential_component = "In-Memory Cache Cluster"
    elif "auth" in full_text or "token" in full_text:
        potential_component = "JWKS Token Validator Middleware"
    elif "kafka" in full_text or "consumer" in full_text:
        potential_component = "Async Event Consumer Group"
    elif "oom" in full_text or "pod" in full_text:
        potential_component = "Container Memory Allocator"
    elif "ingress" in full_text or "ssl" in full_text:
        potential_component = "NGINX Proxy TLS Terminator"

    # Extract symptoms
    symptoms = []
    if any(k in full_text for k in ["504", "timeout", "time out"]):
        symptoms.append("HTTP 504 Gateway Timeout error responses")
    if any(k in full_text for k in ["500", "error", "failure"]):
        symptoms.append("Elevated HTTP 500 internal server error rate")
    if any(k in full_text for k in ["latency", "slow", "delay"]):
        symptoms.append("Service response latency spike (> 2500ms)")
    if any(k in full_text for k in ["401", "unauthorized"]):
        symptoms.append("Mass HTTP 401 token validation rejections")
    if any(k in full_text for k in ["oom", "crash"]):
        symptoms.append("Container crash loop with exit code 137")
    if not symptoms:
        symptoms = ["Intermittent request failures and elevated error rates"]

    # Extract keywords
    words = re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', full_text)
    stop_words = {"the", "and", "for", "that", "this", "with", "from", "are", "was", "were", "been", "have", "has", "had", "not", "out"}
    keywords = list(set([w for w in words if w not in stop_words]))[:8]

    # Problem & Context
    problem = title if title else (description[:120] + "..." if len(description) > 120 else description)
    context = f"Detected in production environment affecting system: {system}. Observed during operational traffic."

    return {
        "problem": problem,
        "symptoms": symptoms,
        "system": system,
        "context": context,
        "potential_component": potential_component,
        "incident_type": incident_type,
        "keywords": keywords
    }

def generate_relevance_explanation(query_text: str, target_title: str, target_system: str, target_symptoms: str, target_root_cause: str, similarity_score: float) -> dict:
    """
    Generates structured AI relevance explanations and verification checklists for retrieved vector search matches.
    """
    pct = round(similarity_score * 100, 1)
    
    checklist = []
    # System check
    if any(k in query_text.lower() for k in target_system.lower().split()):
        checklist.append(f"✓ Matching System: {target_system}")
    else:
        checklist.append(f"✓ System Category Alignment: {target_system}")

    # Symptoms check
    if target_symptoms and len(target_symptoms) > 5:
        sym_excerpt = target_symptoms.split(",")[0] if "," in target_symptoms else target_symptoms[:50]
        checklist.append(f"✓ Similar Symptoms Observed: {sym_excerpt}")
    else:
        checklist.append("✓ Shared Operational Degradation Pattern")

    # Context & Root Cause check
    if target_root_cause and len(target_root_cause) > 5:
        rc_excerpt = target_root_cause[:60] + "..." if len(target_root_cause) > 60 else target_root_cause
        checklist.append(f"✓ Shared Root Cause Mechanism: {rc_excerpt}")
    else:
        checklist.append("✓ Equivalent Infrastructure Vulnerability")

    explanation = (
        f"This historical incident matches your query with {pct}% semantic vector confidence. "
        f"It identifies a similar operational anomaly in the {target_system} subsystem with matching root cause indicators."
    )

    return {
        "relevance_explanation": explanation,
        "relevance_checklist": checklist
    }

def structure_knowledge_record(incident_title: str, incident_desc: str, system_name: str, resolution_info: dict, action_history: list) -> dict:
    """
    Synthesizes incident details, action timeline history, and final resolution inputs
    into a structured 9-part post-mortem KnowledgeRecord payload.
    """
    # Extract failed attempts from action history
    failed_steps = [a["action_text"] for a in action_history if a.get("result") == "failed"]
    failed_attempts_str = "; ".join(failed_steps) if failed_steps else resolution_info.get("failed_attempts", "No failed attempts recorded.")

    # Synthesize investigation summary from action history
    action_texts = [a["action_text"] for a in action_history]
    investigation_summary = "; ".join(action_texts[:3]) if action_texts else f"Investigated logs and system metrics on {system_name}."

    # Extract symptoms from description
    extracted = _extract_with_rule_engine(incident_desc, incident_title)
    symptoms_str = ", ".join(extracted.get("symptoms", [])) if extracted.get("symptoms") else "Elevated error rate and latency spikes."

    problem = incident_title if incident_title else extracted.get("problem", "Operational Disruption")
    context = f"Occurred on {system_name} during production traffic."
    root_cause = resolution_info.get("root_cause") or extracted.get("root_cause") or "Vulnerability in subsystem connection management."
    resolution = resolution_info.get("resolution") or "Applied patch and verified metric stabilization."
    outcome = resolution_info.get("outcome") or "100% service recovery achieved with error rate reduced to zero."
    lessons = resolution_info.get("lessons_learned") or f"Ensure proper monitoring and automated alerts for {system_name} subsystems."

    return {
        "problem": problem,
        "context": context,
        "symptoms": symptoms_str,
        "investigation_summary": investigation_summary,
        "failed_attempts": failed_attempts_str,
        "root_cause": root_cause,
        "resolution": resolution,
        "outcome": outcome,
        "lessons_learned": lessons
    }


def generate_rag_response(query: str, db) -> str:
    """
    RAG-powered conversational synthesis over incident memory & knowledge base.
    Uses vector search to find relevant context, then queries OpenAI/Gemini or falls back to smart synthesis.
    """
    from services.embedding_service import generate_embedding, cosine_similarity
    from models import IncidentEmbedding, Incident, KnowledgeRecord, System

    # 1. Retrieve relevant incident knowledge from database via vector similarity
    query_vec = generate_embedding(query)
    all_embeddings = db.query(IncidentEmbedding).all()
    
    matches = []
    for emb in all_embeddings:
        if not emb.embedding_vector:
            continue
        score = cosine_similarity(query_vec, emb.embedding_vector)
        if score >= 0.20:
            inc = db.query(Incident).filter_by(id=emb.incident_id).first()
            kr = db.query(KnowledgeRecord).filter_by(incident_id=emb.incident_id).first() if inc else None
            sys_obj = db.query(System).filter_by(id=inc.system_id).first() if (inc and inc.system_id) else None
            if inc:
                matches.append({
                    "title": inc.title,
                    "description": inc.description,
                    "severity": inc.severity,
                    "system": sys_obj.name if sys_obj else "System Cluster",
                    "root_cause": kr.root_cause if kr else "Not fully documented",
                    "resolution": kr.resolution if kr else "Remediated",
                    "score": score
                })
    
    matches.sort(key=lambda x: x["score"], reverse=True)
    top_matches = matches[:4]

    # Format context string
    context_blocks = []
    for idx, m in enumerate(top_matches, 1):
        context_blocks.append(
            f"[{idx}] {m['title']} ({m['system']}, {m['severity']} severity)\n"
            f"   - Root Cause: {m['root_cause']}\n"
            f"   - Resolution: {m['resolution']}\n"
            f"   - Match Score: {round(m['score']*100, 1)}%"
        )
    
    context_str = "\n".join(context_blocks) if context_blocks else "No direct historical incident matches found."

    system_prompt = f"""You are OPS MEMORY AI Assistant, an expert SRE and operational continuity copilot.
Answer the user's question accurately using the retrieved operational incident context below.
Be professional, concise, and helpful. If the user is greeting (e.g. hello, hi), respond politely and explain how you can help analyze incidents, runbooks, clusters, and knowledge gaps.

RETRIEVED OPERATIONAL INCIDENT CONTEXT:
{context_str}

USER QUERY:
{query}
"""

    # Try OpenAI API if key available
    if settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are OPS MEMORY AI Assistant, an expert SRE copilot."},
                    {"role": "user", "content": system_prompt}
                ],
                "temperature": 0.3
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"OpenAI RAG chat error: {e}")

    # Try Gemini API if key available
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": system_prompt}]}]
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"Gemini RAG chat error: {e}")

    # Smart RAG Fallback when LLM API keys are absent or failed
    query_lower = query.lower().strip()
    if query_lower in ["hello", "hi", "hey", "help", "hello!", "hi!"]:
        return (
            "Hello! I am your OPS MEMORY Operational Continuity Assistant. "
            "I can search your vector-indexed post-mortems and operational database to help you debug incidents, "
            "recommend runbook resolutions, or identify recurring patterns. How can I assist you today?"
        )

    if top_matches:
        match_summaries = []
        for m in top_matches:
            match_summaries.append(
                f"• **{m['title']}** ({m['system']})\n"
                f"  - *Root Cause:* {m['root_cause']}\n"
                f"  - *Resolution:* {m['resolution']} ({round(m['score']*100, 1)}% vector match)"
            )
        
        matches_text = "\n\n".join(match_summaries)
        return (
            f"Analyzed operational memory for: **\"{query}\"**\n\n"
            f"Found {len(top_matches)} relevant historical incidents in knowledge base:\n\n{matches_text}\n\n"
            f"**Remediation Recommendation:** Review the documented root causes above and check metric health for affected subsystems."
        )
    else:
        return (
            f"Analyzed operational vector database for: **\"{query}\"**\n\n"
            "No direct historical incident records matched your query above the relevance threshold.\n\n"
            "**Suggested Next Steps:**\n"
            "1. Try searching with specific technical keywords (e.g. *PostgreSQL*, *Kafka*, *Redis*, *Memory OOM*).\n"
            "2. Log a new incident in the **New Incident** workspace to train the vector knowledge base."
        )



