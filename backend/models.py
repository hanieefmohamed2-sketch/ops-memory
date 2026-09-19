import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum, JSON, Float
)
from sqlalchemy.orm import relationship
from database import Base, IS_SQLITE

# Try importing pgvector Vector type if available
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False

def get_vector_column():
    """Return pgvector Vector(1536) if using PostgreSQL with pgvector, otherwise JSON fallback."""
    if not IS_SQLITE and HAS_PGVECTOR:
        return Vector(1536)
    return JSON

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False, default="SRE Engineer")
    department = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incidents = relationship("Incident", back_populates="creator")
    actions = relationship("IncidentAction", back_populates="performer")

class System(Base):
    __tablename__ = "systems"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    current_version = Column(String, nullable=True, default="1.0.0")

    incidents = relationship("Incident", back_populates="system")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)

    incidents = relationship("Incident", back_populates="department_rel")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    system_id = Column(String, ForeignKey("systems.id"), nullable=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    severity = Column(String, nullable=False, default="Medium")  # Critical, High, Medium, Low
    status = Column(String, nullable=False, default="Open")  # Open, Investigating, Remediated, Closed
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    business_impact = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    system = relationship("System", back_populates="incidents")
    department_rel = relationship("Department", back_populates="incidents")
    creator = relationship("User", back_populates="incidents")
    actions = relationship("IncidentAction", back_populates="incident", cascade="all, delete-orphan")
    knowledge_records = relationship("KnowledgeRecord", back_populates="incident", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="incident", cascade="all, delete-orphan")
    embeddings = relationship("IncidentEmbedding", back_populates="incident", cascade="all, delete-orphan")

class IncidentAction(Base):
    __tablename__ = "incident_actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    action_text = Column(Text, nullable=False)
    result = Column(String, nullable=False, default="neutral")  # success, failed, neutral
    notes = Column(Text, nullable=True)
    performed_by = Column(String, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="actions")
    performer = relationship("User", back_populates="actions")

class KnowledgeRecord(Base):
    __tablename__ = "knowledge_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    problem = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    investigation_summary = Column(Text, nullable=True)
    failed_attempts = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    outcome = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    verification_status = Column(String, nullable=False, default="needs_review")  # verified, needs_review, outdated
    version_tag = Column(String, nullable=False, default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("Incident", back_populates="knowledge_records")
    sources = relationship("Source", back_populates="knowledge_record", cascade="all, delete-orphan")
    embeddings = relationship("IncidentEmbedding", back_populates="knowledge_record", cascade="all, delete-orphan")

class Source(Base):
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    knowledge_record_id = Column(String, ForeignKey("knowledge_records.id"), nullable=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, log, json, txt
    storage_path = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    knowledge_record = relationship("KnowledgeRecord", back_populates="sources")
    incident = relationship("Incident", back_populates="sources")

class IncidentEmbedding(Base):
    __tablename__ = "incident_embeddings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    knowledge_record_id = Column(String, ForeignKey("knowledge_records.id"), nullable=True)
    embedding_vector = Column(get_vector_column(), nullable=True)
    chunk_text = Column(Text, nullable=False)

    incident = relationship("Incident", back_populates="embeddings")
    knowledge_record = relationship("KnowledgeRecord", back_populates="embeddings")

class IncidentCluster(Base):
    __tablename__ = "incident_clusters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    common_symptoms = Column(Text, nullable=True)
    occurrence_count = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class KnowledgeGap(Base):
    __tablename__ = "knowledge_gaps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_pattern = Column(Text, nullable=False)
    occurrences = Column(Integer, default=1)
    documented_resolutions = Column(Integer, default=0)
    coverage_status = Column(String, default="uncovered", nullable=False)  # uncovered, partial, resolved

    created_at = Column(DateTime, default=datetime.utcnow)
