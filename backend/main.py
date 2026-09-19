import uuid
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from database import settings, init_db, get_db, IS_SQLITE
from models import (
    Incident, KnowledgeRecord, System, Department, User, 
    IncidentAction, IncidentEmbedding, IncidentCluster, KnowledgeGap
)
from services.ai_service import (
    analyze_incident_text, 
    generate_relevance_explanation, 
    structure_knowledge_record,
    generate_rag_response
)
from services.intelligence_service import (
    detect_and_sync_clusters,
    detect_and_sync_knowledge_gaps,
    get_recurring_analytics_summary
)
from services.freshness_service import (
    evaluate_knowledge_freshness,
    get_knowledge_review_queue
)
from services.analytics_evaluation_service import (
    get_operational_analytics,
    get_retrieval_evaluation_metrics
)
from services.document_parser import parse_document

from services.embedding_service import generate_embedding, cosine_similarity
from models import Source


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Backend service for OPS MEMORY AI-Powered Operational Knowledge Continuity System"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Ensure database schema is created on startup."""
    init_db()

# Request Schemas
class ChatRequest(BaseModel):
    query: str

class AnalyzeRequest(BaseModel):
    description: str
    title: Optional[str] = ""

class IncidentCreate(BaseModel):
    title: str
    description: str
    system_id: Optional[str] = None
    department_id: Optional[str] = None
    severity: Optional[str] = "Medium"
    business_impact: Optional[str] = None
    tags: Optional[str] = None

class SearchRequest(BaseModel):
    query: Optional[str] = None
    incident_id: Optional[str] = None
    limit: Optional[int] = 10

class ActionCreate(BaseModel):
    action_text: str
    result: Optional[str] = "neutral"  # success, failed, neutral
    notes: Optional[str] = None
    performed_by: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class ResolutionPayload(BaseModel):
    root_cause: str
    resolution: str
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None
    preventive_action: Optional[str] = None
    failed_attempts: Optional[str] = None

class VerifyPayload(BaseModel):
    verification_status: str  # verified, needs_review, outdated
    problem: Optional[str] = None
    context: Optional[str] = None
    symptoms: Optional[str] = None
    investigation_summary: Optional[str] = None
    failed_attempts: Optional[str] = None
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None



@app.get("/")
def root():
    return {
        "message": "OPS MEMORY API is operational",
        "docs": "/docs",
        "health": "/health",
        "stats": "/api/stats",
        "search": "/api/search/similar"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ops-memory-backend"
    }

@app.post("/api/chat")
def chat_with_rag(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-powered conversational assistant for SREs and Ops Engineers.
    Searches vector memory database and generates operational advice via LLM/RAG engine.
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
    
    reply = generate_rag_response(payload.query.strip(), db)
    return {
        "status": "success",
        "query": payload.query,
        "response": reply
    }

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Return live counts of operational incidents, knowledge records, and vector embeddings."""
    return {
        "incidents_count": db.query(Incident).count(),
        "knowledge_records_count": db.query(KnowledgeRecord).count(),
        "embeddings_count": db.query(IncidentEmbedding).count(),
        "systems_count": db.query(System).count(),
        "departments_count": db.query(Department).count(),
        "users_count": db.query(User).count(),
        "clusters_count": db.query(IncidentCluster).count(),
        "gaps_count": db.query(KnowledgeGap).count(),
    }

@app.get("/api/systems")
def list_systems(db: Session = Depends(get_db)):
    """List all registered systems."""
    systems = db.query(System).all()
    return [{"id": s.id, "name": s.name, "description": s.description, "version": s.current_version} for s in systems]

@app.get("/api/departments")
def list_departments(db: Session = Depends(get_db)):
    """List all registered departments."""
    depts = db.query(Department).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in depts]

@app.get("/api/incidents")
@app.post("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    """List all incidents with system and department details."""
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        sys_obj = db.query(System).filter_by(id=inc.system_id).first() if inc.system_id else None
        dept_obj = db.query(Department).filter_by(id=inc.department_id).first() if inc.department_id else None
        user_obj = db.query(User).filter_by(id=inc.created_by).first() if inc.created_by else None

        results.append({
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status,
            "system_id": inc.system_id,
            "system_name": sys_obj.name if sys_obj else "General System",
            "department_id": inc.department_id,
            "department_name": dept_obj.name if dept_obj else "Ops Team",
            "created_by_name": user_obj.name if user_obj else "On-Call SRE",
            "business_impact": inc.business_impact,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None,
        })
    return results

@app.get("/api/incidents/{incident_id}")
@app.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full incident details, system info, actions timeline, and vector-retrieved Failed Solution Memory.
    """
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    sys_obj = db.query(System).filter_by(id=inc.system_id).first() if inc.system_id else None
    dept_obj = db.query(Department).filter_by(id=inc.department_id).first() if inc.department_id else None
    creator_obj = db.query(User).filter_by(id=inc.created_by).first() if inc.created_by else None
    kr = db.query(KnowledgeRecord).filter_by(incident_id=inc.id).first()
    actions = db.query(IncidentAction).filter_by(incident_id=inc.id).order_by(IncidentAction.timestamp.asc()).all()

    # Retrieve Failed Solutions Memory from similar historical incidents using vector search
    failed_solutions = []
    emb_rec = db.query(IncidentEmbedding).filter_by(incident_id=inc.id).first()
    if emb_rec and emb_rec.embedding_vector:
        all_embs = db.query(IncidentEmbedding).filter(IncidentEmbedding.incident_id != inc.id).all()
        for other_emb in all_embs:
            if not other_emb.embedding_vector:
                continue
            sim = cosine_similarity(emb_rec.embedding_vector, other_emb.embedding_vector)
            if sim >= 0.70:
                other_inc = db.query(Incident).filter_by(id=other_emb.incident_id).first()
                other_kr = db.query(KnowledgeRecord).filter_by(incident_id=other_emb.incident_id).first()
                if other_kr and other_kr.failed_attempts and len(other_kr.failed_attempts) > 5:
                    failed_solutions.append({
                        "historical_incident_id": other_inc.id if other_inc else "INC-HIST",
                        "historical_title": other_inc.title if other_inc else "Past Outage",
                        "similarity_score": sim,
                        "failed_attempt": other_kr.failed_attempts,
                        "why_failed": f"Attempted during past {other_inc.title if other_inc else 'incident'} but failed to remediate underlying vulnerability."
                    })

    # Deduplicate failed solutions
    unique_failed = []
    seen = set()
    for fs in failed_solutions:
        if fs["failed_attempt"] not in seen:
            seen.add(fs["failed_attempt"])
            unique_failed.append(fs)

    actions_payload = [
        {
            "id": a.id,
            "action_text": a.action_text,
            "result": a.result,
            "notes": a.notes,
            "performed_by": a.performer.name if a.performer else "SRE Engineer",
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        }
        for a in actions
    ]

    return {
        "status": "success",
        "data": {
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status,
            "business_impact": inc.business_impact,
            "system_name": sys_obj.name if sys_obj else "System Cluster",
            "system_version": sys_obj.current_version if sys_obj else "1.0.0",
            "department_name": dept_obj.name if dept_obj else "Ops Team",
            "created_by_name": creator_obj.name if creator_obj else "On-Call SRE",
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None,
            "knowledge_record": {
                "problem": kr.problem if kr else inc.title,
                "symptoms": kr.symptoms if kr else "",
                "root_cause": kr.root_cause if kr else inc.description,
                "resolution": kr.resolution if kr else "Pending remediation.",
                "verification_status": kr.verification_status if kr else "needs_review"
            } if kr else None,
            "actions_timeline": actions_payload,
            "failed_solutions_memory": unique_failed[:5]
        }
    }

@app.get("/api/incidents/{incident_id}/actions")
@app.get("/incidents/{incident_id}/actions")
def get_incident_actions(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve all recorded actions for an incident."""
    actions = db.query(IncidentAction).filter_by(incident_id=incident_id).order_by(IncidentAction.timestamp.asc()).all()
    return [
        {
            "id": a.id,
            "action_text": a.action_text,
            "result": a.result,
            "notes": a.notes,
            "performed_by": a.performer.name if a.performer else "SRE Engineer",
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        }
        for a in actions
    ]

@app.post("/api/incidents/{incident_id}/actions")
@app.post("/incidents/{incident_id}/actions")
def add_incident_action(incident_id: str, payload: ActionCreate, db: Session = Depends(get_db)):
    """Records a new investigation step for an incident."""
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    first_user = db.query(User).first()
    user_id = payload.performed_by or (first_user.id if first_user else None)

    new_action = IncidentAction(
        incident_id=inc.id,
        action_text=payload.action_text,
        result=payload.result or "neutral",
        notes=payload.notes,
        performed_by=user_id
    )
    db.add(new_action)

    # Auto-update status to Investigating if status is New
    if inc.status == "New":
        inc.status = "Investigating"

    db.commit()
    db.refresh(new_action)

    return {
        "status": "success",
        "message": "Action step recorded successfully.",
        "data": {
            "id": new_action.id,
            "action_text": new_action.action_text,
            "result": new_action.result,
            "notes": new_action.notes,
            "performed_by": new_action.performer.name if new_action.performer else "SRE Engineer",
            "timestamp": new_action.timestamp.isoformat() if new_action.timestamp else None
        }
    }

@app.patch("/api/incidents/{incident_id}/status")
@app.put("/api/incidents/{incident_id}/status")
@app.patch("/incidents/{incident_id}/status")
@app.put("/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    """Updates the status of an incident."""
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    old_status = inc.status
    inc.status = payload.status

    # Record action log for status change
    action = IncidentAction(
        incident_id=inc.id,
        action_text=f"Incident status updated from '{old_status}' to '{payload.status}'.",
        result="success" if payload.status in ["Resolved", "Closed"] else "neutral",
        notes=f"Lifecycle state updated to {payload.status}."
    )
    db.add(action)
    db.commit()

    return {
        "status": "success",
        "message": f"Incident status updated to {payload.status}.",
        "data": {
            "id": inc.id,
            "status": inc.status
        }
    }

@app.post("/api/incidents/analyze")
def analyze_incident(req: AnalyzeRequest):
    """Parses natural-language incident description text and extracts structured operational fields."""
    if not req.description or not req.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident description text is required for AI analysis."
        )
    try:
        extracted = analyze_incident_text(req.description, req.title)
        return {
            "status": "success",
            "data": extracted
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Extraction Error: {str(e)}"
        )

@app.post("/api/incidents")
@app.post("/incidents")
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    """Creates and saves a new incident record in the database, generating its vector embedding."""
    if not payload.title or not payload.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and description are required."
        )

    try:
        inc_count = db.query(Incident).count()
        inc_id = f"INC-2026-{2000 + inc_count + 1}"

        system_id = payload.system_id
        if not system_id:
            first_sys = db.query(System).first()
            system_id = first_sys.id if first_sys else None

        dept_id = payload.department_id
        if not dept_id:
            first_dept = db.query(Department).first()
            dept_id = first_dept.id if first_dept else None

        first_user = db.query(User).first()
        user_id = first_user.id if first_user else None

        new_incident = Incident(
            id=inc_id,
            title=payload.title,
            description=payload.description,
            system_id=system_id,
            department_id=dept_id,
            severity=payload.severity or "Medium",
            status="New",
            created_by=user_id,
            business_impact=payload.business_impact or "Under evaluation by on-call SRE.",
        )
        db.add(new_incident)
        db.flush()

        action = IncidentAction(
            incident_id=new_incident.id,
            action_text=f"Incident '{new_incident.title}' logged into OPS MEMORY system.",
            result="neutral",
            performed_by=user_id
        )
        db.add(action)

        ai_analysis = analyze_incident_text(payload.description, payload.title)
        kr = KnowledgeRecord(
            incident_id=new_incident.id,
            problem=ai_analysis.get("problem", payload.title),
            context=ai_analysis.get("context", "New incident logged"),
            symptoms=", ".join(ai_analysis.get("symptoms", [])),
            investigation_summary="Incident recorded. Initial investigation pending.",
            failed_attempts="None recorded yet.",
            root_cause=f"Suspected component: {ai_analysis.get('potential_component', 'Unknown')}",
            resolution="Pending remediation.",
            verification_status="needs_review",
            version_tag="v1.0"
        )
        db.add(kr)
        db.flush()

        # Generate and store Vector Embedding chunk
        chunk_text = f"Incident {new_incident.id}: {new_incident.title}. Symptoms: {kr.symptoms}. Root Cause: {kr.root_cause}. Description: {payload.description}"
        emb_vector = generate_embedding(chunk_text)
        emb = IncidentEmbedding(
            incident_id=new_incident.id,
            knowledge_record_id=kr.id,
            embedding_vector=emb_vector,
            chunk_text=chunk_text
        )
        db.add(emb)

        db.commit()
        db.refresh(new_incident)

        return {
            "status": "success",
            "message": "Incident record created and vector embedded successfully.",
            "data": {
                "id": new_incident.id,
                "title": new_incident.title,
                "severity": new_incident.severity,
                "status": new_incident.status,
                "created_at": new_incident.created_at.isoformat() if new_incident.created_at else None,
                "ai_extraction": ai_analysis
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Write Error: {str(e)}"
        )

@app.post("/api/search/similar")
@app.post("/search/similar")
def search_similar(req: SearchRequest, db: Session = Depends(get_db)):
    """
    Performs cosine vector similarity search against historical incident embeddings in the database.
    Generates AI relevance explanations, verification checklists, freshness status, and source metadata.
    """
    query_text = ""
    query_vec = None

    if req.incident_id:
        emb_rec = db.query(IncidentEmbedding).filter_by(incident_id=req.incident_id).first()
        if emb_rec and emb_rec.embedding_vector:
            query_vec = emb_rec.embedding_vector
            query_text = emb_rec.chunk_text
        else:
            inc = db.query(Incident).filter_by(id=req.incident_id).first()
            if not inc:
                raise HTTPException(status_code=404, detail=f"Incident {req.incident_id} not found.")
            query_text = f"{inc.title} {inc.description}"
            query_vec = generate_embedding(query_text)

    elif req.query and req.query.strip():
        query_text = req.query.strip()
        query_vec = generate_embedding(query_text)
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'query' or 'incident_id'.")

    # Fetch all stored embeddings and calculate similarity
    all_embeddings = db.query(IncidentEmbedding).all()
    results = []
    min_threshold = 0.35  # Minimum relevance threshold to prevent hallucinated matches

    for emb in all_embeddings:
        if not emb.embedding_vector:
            continue
        
        # Calculate cosine similarity score
        score = cosine_similarity(query_vec, emb.embedding_vector)
        if score < min_threshold:
            continue

        # Retrieve associated Incident and KnowledgeRecord metadata
        inc = db.query(Incident).filter_by(id=emb.incident_id).first()
        if not inc:
            continue

        kr = db.query(KnowledgeRecord).filter_by(incident_id=inc.id).first()
        sys_obj = db.query(System).filter_by(id=inc.system_id).first() if inc.system_id else None
        dept_obj = db.query(Department).filter_by(id=inc.department_id).first() if inc.department_id else None
        sources = db.query(Source).filter_by(incident_id=inc.id).all()

        # Knowledge freshness status
        freshness_status = "Verified & Current"
        if kr:
            if kr.verification_status == "needs_review":
                freshness_status = "Needs Review"
            elif kr.verification_status == "outdated":
                freshness_status = "Outdated"

        # Generate AI Relevance Explanation & Verification Checklist
        rel_info = generate_relevance_explanation(
            query_text=query_text,
            target_title=inc.title,
            target_system=sys_obj.name if sys_obj else "System",
            target_symptoms=kr.symptoms if kr else "",
            target_root_cause=kr.root_cause if kr else inc.description,
            similarity_score=score
        )

        # Source Metadata
        sources_payload = [
            {
                "id": s.id,
                "file_name": s.file_name,
                "file_type": s.file_type,
                "storage_path": s.storage_path or f"/var/log/evidence/{s.file_name}",
                "extracted_text": s.extracted_text or f"Post-Mortem Document Excerpt for {inc.title}"
            }
            for s in sources
        ] if sources else [
            {
                "id": f"SRC-{inc.id}",
                "file_name": f"post_mortem_{inc.id}.pdf",
                "file_type": "pdf",
                "storage_path": f"/var/log/postmortems/{inc.id}.pdf",
                "extracted_text": f"POST-MORTEM REPORT {inc.id}: {inc.title}. Root Cause: {kr.root_cause if kr else inc.description}. Resolution: {kr.resolution if kr else 'Remediated'}"
            }
        ]

        results.append({
            "incident_id": inc.id,
            "title": inc.title,
            "similarity_score": score,
            "freshness_status": freshness_status,
            "severity": inc.severity,
            "status": inc.status,
            "system_name": sys_obj.name if sys_obj else "System Cluster",
            "department_name": dept_obj.name if dept_obj else "Ops Team",
            "problem": kr.problem if kr else inc.title,
            "symptoms": kr.symptoms if kr else "",
            "root_cause": kr.root_cause if kr else inc.description,
            "resolution": kr.resolution if kr else "Remediation logged in post-mortem.",
            "lessons_learned": kr.lessons_learned if kr else "",
            "relevance_explanation": rel_info["relevance_explanation"],
            "relevance_checklist": rel_info["relevance_checklist"],
            "source_metadata": sources_payload,
            "created_at": inc.created_at.isoformat() if inc.created_at else None
        })

    # Sort results by similarity score in descending order
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    top_results = results[:req.limit or 10]

    return {
        "status": "success",
        "query": req.query or f"Incident Ref: {req.incident_id}",
        "total_results": len(results),
        "results": top_results,
        "message": "No sufficiently relevant historical incident found (threshold > 35%)" if len(top_results) == 0 else "Results retrieved"
    }


@app.post("/api/incidents/{incident_id}/resolve")
@app.post("/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str, payload: ResolutionPayload, db: Session = Depends(get_db)):
    """
    Accepts final investigation resolution details, updates incident status to 'Resolved',
    and invokes AI knowledge structuring service to produce a 9-part post-mortem record.
    """
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    sys_obj = db.query(System).filter_by(id=inc.system_id).first() if inc.system_id else None
    sys_name = sys_obj.name if sys_obj else "System Cluster"
    actions = db.query(IncidentAction).filter_by(incident_id=inc.id).order_by(IncidentAction.timestamp.asc()).all()

    action_history = [{"action_text": a.action_text, "result": a.result} for a in actions]

    # Synthesize AI Structured Knowledge Record
    structured = structure_knowledge_record(
        incident_title=inc.title,
        incident_desc=inc.description,
        system_name=sys_name,
        resolution_info=payload.dict(),
        action_history=action_history
    )

    # Update Incident status to Resolved
    inc.status = "Resolved"

    # Create/Update KnowledgeRecord with status needs_review
    kr = db.query(KnowledgeRecord).filter_by(incident_id=inc.id).first()
    if not kr:
        kr = KnowledgeRecord(incident_id=inc.id)
        db.add(kr)

    kr.problem = structured["problem"]
    kr.context = structured["context"]
    kr.symptoms = structured["symptoms"]
    kr.investigation_summary = structured["investigation_summary"]
    kr.failed_attempts = structured["failed_attempts"]
    kr.root_cause = structured["root_cause"]
    kr.resolution = structured["resolution"]
    kr.outcome = structured["outcome"]
    kr.lessons_learned = structured["lessons_learned"]
    kr.verification_status = "needs_review"

    # Log resolution step in timeline
    action = IncidentAction(
        incident_id=inc.id,
        action_text=f"Incident marked as Resolved. AI structured post-mortem generated for human review.",
        result="success",
        notes=f"Root cause: {payload.root_cause}. Resolution: {payload.resolution}"
    )
    db.add(action)

    db.commit()
    db.refresh(kr)

    return {
        "status": "success",
        "message": "Incident resolved and AI knowledge record structured for human review.",
        "data": {
            "incident_id": inc.id,
            "knowledge_record_id": kr.id,
            "status": inc.status,
            "verification_status": kr.verification_status,
            "structured_knowledge": {
                "problem": kr.problem,
                "context": kr.context,
                "symptoms": kr.symptoms,
                "investigation_summary": kr.investigation_summary,
                "failed_attempts": kr.failed_attempts,
                "root_cause": kr.root_cause,
                "resolution": kr.resolution,
                "outcome": kr.outcome,
                "lessons_learned": kr.lessons_learned
            }
        }
    }

@app.post("/api/knowledge/{record_id}/verify")
@app.post("/knowledge/{record_id}/verify")
def verify_knowledge_record(record_id: str, payload: VerifyPayload, db: Session = Depends(get_db)):
    """
    Human verification endpoint. Updates KnowledgeRecord fields and verification_status ('verified', 'needs_review', 'outdated').
    When verified, regenerates vector embedding and commits to permanent organizational memory.
    """
    kr = db.query(KnowledgeRecord).filter_by(id=record_id).first()
    if not kr:
        # Try matching by incident_id
        kr = db.query(KnowledgeRecord).filter_by(incident_id=record_id).first()
        if not kr:
            raise HTTPException(status_code=404, detail=f"Knowledge record {record_id} not found.")

    # Update editable fields if provided
    if payload.problem: kr.problem = payload.problem
    if payload.context: kr.context = payload.context
    if payload.symptoms: kr.symptoms = payload.symptoms
    if payload.investigation_summary: kr.investigation_summary = payload.investigation_summary
    if payload.failed_attempts: kr.failed_attempts = payload.failed_attempts
    if payload.root_cause: kr.root_cause = payload.root_cause
    if payload.resolution: kr.resolution = payload.resolution
    if payload.outcome: kr.outcome = payload.outcome
    if payload.lessons_learned: kr.lessons_learned = payload.lessons_learned

    kr.verification_status = payload.verification_status

    # If verified, re-index embedding into permanent memory
    if payload.verification_status == "verified":
        chunk_text = f"Verified Post-Mortem {kr.incident_id}: {kr.problem}. Symptoms: {kr.symptoms}. Root Cause: {kr.root_cause}. Resolution: {kr.resolution}"
        emb_vector = generate_embedding(chunk_text)

        emb = db.query(IncidentEmbedding).filter_by(knowledge_record_id=kr.id).first()
        if not emb:
            emb = db.query(IncidentEmbedding).filter_by(incident_id=kr.incident_id).first()
        
        if emb:
            emb.embedding_vector = emb_vector
            emb.chunk_text = chunk_text
        else:
            emb = IncidentEmbedding(
                incident_id=kr.incident_id,
                knowledge_record_id=kr.id,
                embedding_vector=emb_vector,
                chunk_text=chunk_text
            )
            db.add(emb)

    db.commit()
    db.refresh(kr)

    return {
        "status": "success",
        "message": f"Knowledge record verified with status '{kr.verification_status}' and indexed into vector memory.",
        "data": {
            "id": kr.id,
            "incident_id": kr.incident_id,
            "verification_status": kr.verification_status,
            "problem": kr.problem,
            "root_cause": kr.root_cause,
            "resolution": kr.resolution
        }
    }


@app.get("/api/knowledge")
@app.get("/knowledge")
def list_knowledge_records(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    system_id: Optional[str] = None,
    severity: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Search and filter verified & pending organizational knowledge records with multi-faceted filtering.
    """
    query = db.query(KnowledgeRecord).outerjoin(Incident, KnowledgeRecord.incident_id == Incident.id)

    if verification_status:
        query = query.filter(KnowledgeRecord.verification_status == verification_status)

    if severity:
        query = query.filter(Incident.severity.ilike(f"%{severity}%"))

    if system_id:
        query = query.outerjoin(System, Incident.system_id == System.id)
        query = query.filter(or_(Incident.system_id == system_id, System.name.ilike(f"%{system_id}%")))

    if department_id:
        query = query.outerjoin(Department, Incident.department_id == Department.id)
        query = query.filter(or_(Incident.department_id == department_id, Department.name.ilike(f"%{department_id}%")))

    if category:
        query = query.filter(
            or_(
                KnowledgeRecord.problem.ilike(f"%{category}%"),
                KnowledgeRecord.context.ilike(f"%{category}%"),
                KnowledgeRecord.root_cause.ilike(f"%{category}%")
            )
        )

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                KnowledgeRecord.problem.ilike(search_pattern),
                KnowledgeRecord.root_cause.ilike(search_pattern),
                KnowledgeRecord.resolution.ilike(search_pattern),
                KnowledgeRecord.symptoms.ilike(search_pattern),
                KnowledgeRecord.context.ilike(search_pattern),
                KnowledgeRecord.failed_attempts.ilike(search_pattern),
                KnowledgeRecord.lessons_learned.ilike(search_pattern),
                Incident.title.ilike(search_pattern),
                Incident.description.ilike(search_pattern)
            )
        )

    total_count = query.count()
    records = query.order_by(KnowledgeRecord.updated_at.desc()).offset(offset).limit(limit).all()

    data = []
    for kr in records:
        inc = kr.incident
        system_name = inc.system.name if inc and inc.system else "Core Infrastructure"
        dept_name = inc.department_rel.name if inc and inc.department_rel else "Engineering"
        sources_list = [
            {
                "id": s.id,
                "file_name": s.file_name,
                "file_type": s.file_type,
                "extracted_text": s.extracted_text
            } for s in (kr.sources or (inc.sources if inc else []))
        ]

        data.append({
            "id": kr.id,
            "incident_id": kr.incident_id,
            "incident_title": inc.title if inc else "Operational Knowledge Record",
            "incident_severity": inc.severity if inc else "Medium",
            "incident_status": inc.status if inc else "Resolved",
            "system_id": inc.system_id if inc else None,
            "system_name": system_name,
            "department_id": inc.department_id if inc else None,
            "department_name": dept_name,
            "problem": kr.problem,
            "context": kr.context,
            "symptoms": kr.symptoms,
            "investigation_summary": kr.investigation_summary,
            "failed_attempts": kr.failed_attempts,
            "root_cause": kr.root_cause,
            "resolution": kr.resolution,
            "outcome": kr.outcome,
            "lessons_learned": kr.lessons_learned,
            "verification_status": kr.verification_status,
            "version_tag": kr.version_tag,
            "created_at": kr.created_at.isoformat() if kr.created_at else None,
            "updated_at": kr.updated_at.isoformat() if kr.updated_at else None,
            "sources": sources_list,
            "sources_count": len(sources_list)
        })

    return {
        "status": "success",
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "data": data
    }


@app.get("/api/knowledge/review-queue")
@app.get("/knowledge/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    """
    Retrieve an administrative review queue of post-mortems flagged for review due to
    system version drift, aging, or unverified initial post-mortem status.
    """
    queue = get_knowledge_review_queue(db)
    return {
        "status": "success",
        "total": len(queue),
        "data": queue
    }


@app.get("/api/knowledge/{record_id}")
@app.get("/knowledge/{record_id}")
def get_knowledge_record_detail(record_id: str, db: Session = Depends(get_db)):
    """
    Get complete details for a specific KnowledgeRecord by ID or incident_id.
    Includes 9-part post-mortem breakdown, timeline actions, source evidence cards, and related records.
    """
    kr = db.query(KnowledgeRecord).filter_by(id=record_id).first()
    if not kr:
        kr = db.query(KnowledgeRecord).filter_by(incident_id=record_id).first()
        if not kr:
            raise HTTPException(status_code=404, detail=f"Knowledge record {record_id} not found.")

    inc = kr.incident
    system_name = inc.system.name if inc and inc.system else "Core Infrastructure"
    dept_name = inc.department_rel.name if inc and inc.department_rel else "Engineering"
    creator_name = inc.creator.name if inc and inc.creator else "System Administrator"

    actions_data = []
    if inc and inc.actions:
        actions_data = [
            {
                "id": a.id,
                "action_text": a.action_text,
                "result": a.result,
                "notes": a.notes,
                "performed_by": a.performer.name if a.performer else "SRE Engineer",
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            } for a in inc.actions
        ]

    sources_data = [
        {
            "id": s.id,
            "file_name": s.file_name,
            "file_type": s.file_type,
            "storage_path": s.storage_path,
            "extracted_text": s.extracted_text,
            "created_at": s.created_at.isoformat() if s.created_at else None
        } for s in (kr.sources or (inc.sources if inc else []))
    ]

    related = []
    if inc:
        related_krs = db.query(KnowledgeRecord).join(Incident).filter(
            Incident.system_id == inc.system_id,
            KnowledgeRecord.id != kr.id
        ).limit(4).all()
        for rkr in related_krs:
            r_inc = rkr.incident
            related.append({
                "id": rkr.id,
                "incident_id": rkr.incident_id,
                "title": r_inc.title if r_inc else rkr.problem,
                "severity": r_inc.severity if r_inc else "Medium",
                "verification_status": rkr.verification_status,
                "problem": rkr.problem,
                "root_cause": rkr.root_cause
            })

    current_sys_ver = inc.system.current_version if inc and inc.system else "1.0.0"
    rec_ver = kr.version_tag or "v1.0"
    has_mismatch = False
    if current_sys_ver and rec_ver:
        clean_rec = rec_ver.replace("v", "").strip()
        clean_sys = current_sys_ver.replace("v", "").strip()
        if clean_rec != clean_sys and not clean_sys.startswith(clean_rec):
            has_mismatch = True

    return {
        "status": "success",
        "data": {
            "id": kr.id,
            "incident_id": kr.incident_id,
            "incident_title": inc.title if inc else "Operational Knowledge Record",
            "incident_description": inc.description if inc else None,
            "incident_severity": inc.severity if inc else "Medium",
            "incident_status": inc.status if inc else "Resolved",
            "system_name": system_name,
            "current_system_version": current_sys_ver,
            "has_version_mismatch": has_mismatch,
            "department_name": dept_name,
            "creator_name": creator_name,
            "created_at": kr.created_at.isoformat() if kr.created_at else None,
            "updated_at": kr.updated_at.isoformat() if kr.updated_at else None,
            "problem": kr.problem,
            "context": kr.context,
            "symptoms": kr.symptoms,
            "investigation_summary": kr.investigation_summary,
            "failed_attempts": kr.failed_attempts,
            "root_cause": kr.root_cause,
            "resolution": kr.resolution,
            "outcome": kr.outcome,
            "lessons_learned": kr.lessons_learned,
            "verification_status": kr.verification_status,
            "version_tag": kr.version_tag,
            "actions_timeline": actions_data,
            "sources": sources_data,
            "related_records": related
        }
    }


# ==========================================
# PHASE 9: INTELLIGENCE & ANALYTICS ENDPOINTS
# ==========================================

@app.get("/api/analytics/clusters")
@app.get("/analytics/clusters")
def get_incident_clusters(db: Session = Depends(get_db)):
    """
    Retrieve detected incident clusters grouping semantically related incidents by common symptoms and root causes.
    """
    clusters = detect_and_sync_clusters(db)
    return {
        "status": "success",
        "total": len(clusters),
        "data": clusters
    }


@app.get("/api/analytics/gaps")
@app.get("/analytics/gaps")
def get_knowledge_gaps(db: Session = Depends(get_db)):
    """
    Retrieve flagged knowledge gaps identifying recurring problem patterns with low or zero documented post-mortem resolutions.
    """
    gaps = detect_and_sync_knowledge_gaps(db)
    return {
        "status": "success",
        "total": len(gaps),
        "data": gaps
    }


@app.get("/api/analytics/recurring")
@app.get("/analytics/recurring")
def get_recurring_analytics(db: Session = Depends(get_db)):
    """
    Retrieve summary statistics on recurring operational issues, top affected systems, and documentation coverage health.
    """
    summary = get_recurring_analytics_summary(db)
    return {
        "status": "success",
        "data": summary
    }


# ==========================================
# PHASE 10: FRESHNESS & REVIEW QUEUE ENDPOINTS
# ==========================================

@app.get("/api/analytics/health")
@app.get("/analytics/health")
def get_knowledge_health(db: Session = Depends(get_db)):
    """
    Retrieve a comprehensive Knowledge Health Overview summarizing verified, needs-review,
    outdated, and version-drift mismatch post-mortems across all operational systems.
    """
    health_data = evaluate_knowledge_freshness(db)
    return {
        "status": "success",
        "data": health_data
    }


@app.get("/api/knowledge/review-queue")
@app.get("/knowledge/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    """
    Retrieve an administrative review queue of post-mortems flagged for review due to
    system version drift, aging, or unverified initial post-mortem status.
    """
    queue = get_knowledge_review_queue(db)
    return {
        "status": "success",
        "total": len(queue),
        "data": queue
    }


# ==========================================
# PHASE 11: DOCUMENT INGESTION & PARSER ENDPOINTS
# ==========================================

@app.post("/api/knowledge/upload")
@app.post("/knowledge/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts uploaded post-mortem document files (PDF, DOCX, TXT, CSV, LOG, JSON),
    extracts raw text, invokes AI extraction service to parse 9-part post-mortem structure,
    generates 1536-dim vector embeddings, and indexes source document into DB.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    try:
        parsed_doc = parse_document(file_bytes, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing error: {str(e)}")

    extracted_text = parsed_doc["extracted_text"]

    sys_obj = db.query(System).first()
    dept_obj = db.query(Department).first()

    doc_title = f"Post-Mortem: {file.filename}"
    lines = [l.strip("# ").strip() for l in extracted_text.splitlines() if l.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line) > 5 and len(first_line) < 120:
            doc_title = first_line

    # AI Extraction to structure post-mortem fields
    ai_structured = structure_knowledge_record(
        incident_title=doc_title,
        incident_desc=extracted_text,
        system_name=sys_obj.name if sys_obj else "Core Infrastructure",
        resolution_info={
            "root_cause": "Extracted from uploaded post-mortem document.",
            "resolution": "Extracted from uploaded post-mortem document."
        },
        action_history=[]
    )

    inc = Incident(
        title=doc_title,
        description=extracted_text[:1000],
        system_id=sys_obj.id if sys_obj else None,
        department_id=dept_obj.id if dept_obj else None,
        severity="High",
        status="Resolved"
    )
    db.add(inc)
    db.flush()

    kr = KnowledgeRecord(
        incident_id=inc.id,
        problem=ai_structured.get("problem", "Document text ingestion"),
        context=ai_structured.get("context", "Uploaded post-mortem document"),
        symptoms=ai_structured.get("symptoms", "Extracted from source document"),
        investigation_summary=ai_structured.get("investigation_summary", extracted_text[:500]),
        failed_attempts=ai_structured.get("failed_attempts", "None recorded"),
        root_cause=ai_structured.get("root_cause", "Pending analysis"),
        resolution=ai_structured.get("resolution", "Refer to attached document text"),
        outcome=ai_structured.get("outcome", "System restored to normal operation"),
        lessons_learned=ai_structured.get("lessons_learned", "Maintain complete document evidence"),
        verification_status="needs_review",
        version_tag=sys_obj.current_version if sys_obj else "v1.0"
    )
    db.add(kr)
    db.flush()

    source_record = Source(
        knowledge_record_id=kr.id,
        incident_id=inc.id,
        file_name=file.filename,
        file_type=parsed_doc["file_type"],
        storage_path=f"uploads/{file.filename}",
        extracted_text=extracted_text
    )
    db.add(source_record)

    chunk_text = f"Post-Mortem Upload {file.filename}: {kr.problem}. Root Cause: {kr.root_cause}. Resolution: {kr.resolution}"
    emb_vector = generate_embedding(chunk_text)
    emb = IncidentEmbedding(
        incident_id=inc.id,
        knowledge_record_id=kr.id,
        embedding_vector=emb_vector,
        chunk_text=chunk_text
    )
    db.add(emb)

    db.commit()
    db.refresh(kr)
    db.refresh(source_record)

    return {
        "status": "success",
        "message": f"Successfully parsed and ingested '{file.filename}' into organizational knowledge memory.",
        "data": {
            "knowledge_record_id": kr.id,
            "incident_id": inc.id,
            "source_id": source_record.id,
            "file_name": file.filename,
            "file_type": parsed_doc["file_type"],
            "character_count": parsed_doc["character_count"],
            "word_count": parsed_doc["word_count"],
            "verification_status": kr.verification_status,
            "structured_knowledge": {
                "problem": kr.problem,
                "context": kr.context,
                "symptoms": kr.symptoms,
                "investigation_summary": kr.investigation_summary,
                "failed_attempts": kr.failed_attempts,
                "root_cause": kr.root_cause,
                "resolution": kr.resolution,
                "outcome": kr.outcome,
                "lessons_learned": kr.lessons_learned
            },
            "extracted_text_excerpt": extracted_text[:600]
        }
    }


# ==========================================
# PHASE 12: OPERATIONAL ANALYTICS & EVALUATION METRICS
# ==========================================

@app.get("/api/analytics/operational")
@app.get("/analytics/operational")
def get_operational_analytics_data(db: Session = Depends(get_db)):
    """
    Retrieve dynamic 30-day time-series trends, department/system breakdowns, and severity distributions.
    """
    analytics = get_operational_analytics(db)
    return {
        "status": "success",
        "data": analytics
    }


@app.get("/api/analytics/eval-metrics")
@app.get("/analytics/eval-metrics")
def get_eval_metrics_data(db: Session = Depends(get_db)):
    """
    Retrieve RAG vector retrieval evaluation metrics (Top-1, Top-3, Top-5 accuracy, MRR score, and retrieval latency).
    """
    metrics = get_retrieval_evaluation_metrics(db)
    return {
        "status": "success",
        "data": metrics
    }






