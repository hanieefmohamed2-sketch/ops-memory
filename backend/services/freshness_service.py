from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import KnowledgeRecord, Incident, System


def evaluate_knowledge_freshness(db: Session) -> Dict[str, Any]:
    """
    Evaluates knowledge freshness across all post-mortems by comparing recorded versions
    against current system versions and checking verification timestamps.
    """
    records = db.query(KnowledgeRecord).all()
    total_records = len(records)

    verified_count = 0
    needs_review_count = 0
    outdated_count = 0
    version_mismatch_count = 0

    now = datetime.utcnow()
    ninety_days_ago = now - timedelta(days=90)

    systems_map = {}

    for kr in records:
        inc = kr.incident
        sys_obj = inc.system if inc else None
        current_version = sys_obj.current_version if sys_obj else "1.0.0"
        system_name = sys_obj.name if sys_obj else "Core Infrastructure"

        # Check version mismatch (e.g. kr.version_tag != current_version)
        recorded_version = kr.version_tag or "v1.0"
        has_version_mismatch = False
        if sys_obj and sys_obj.current_version and recorded_version:
            clean_rec_ver = recorded_version.replace("v", "").strip()
            clean_sys_ver = sys_obj.current_version.replace("v", "").strip()
            if clean_rec_ver != clean_sys_ver and not clean_sys_ver.startswith(clean_rec_ver):
                has_version_mismatch = True

        if has_version_mismatch:
            version_mismatch_count += 1

        # Status counts
        status = kr.verification_status
        if status == "verified":
            verified_count += 1
        elif status == "outdated":
            outdated_count += 1
        else:
            needs_review_count += 1

        # Track per system
        if system_name not in systems_map:
            systems_map[system_name] = {
                "system_name": system_name,
                "current_version": current_version,
                "total_records": 0,
                "verified": 0,
                "mismatches": 0
            }
        systems_map[system_name]["total_records"] += 1
        if status == "verified":
            systems_map[system_name]["verified"] += 1
        if has_version_mismatch:
            systems_map[system_name]["mismatches"] += 1

    systems_summary = []
    for sname, sdata in systems_map.items():
        tot = sdata["total_records"]
        score = round((sdata["verified"] / max(tot, 1)) * 100, 1)
        systems_summary.append({
            "system_name": sname,
            "current_version": sdata["current_version"],
            "total_records": tot,
            "verified_records": sdata["verified"],
            "version_mismatches": sdata["mismatches"],
            "freshness_score": score
        })

    freshness_health_score = round((verified_count / max(total_records, 1)) * 100, 1)

    return {
        "total_knowledge_records": total_records,
        "verified_count": verified_count,
        "needs_review_count": needs_review_count,
        "outdated_count": outdated_count,
        "version_mismatch_count": version_mismatch_count,
        "freshness_health_score": freshness_health_score,
        "systems_summary": systems_summary
    }


def get_knowledge_review_queue(db: Session) -> List[Dict[str, Any]]:
    """
    Returns an administrative review queue of knowledge records that are flagged for review
    due to system version drift, age (>90 days), or unverified status.
    """
    records = db.query(KnowledgeRecord).all()
    queue = []
    now = datetime.utcnow()

    for kr in records:
        inc = kr.incident
        sys_obj = inc.system if inc else None
        current_version = sys_obj.current_version if sys_obj else "1.0.0"
        system_name = sys_obj.name if sys_obj else "Core Infrastructure"
        recorded_version = kr.version_tag or "v1.0"

        has_version_mismatch = False
        if sys_obj and sys_obj.current_version and recorded_version:
            clean_rec_ver = recorded_version.replace("v", "").strip()
            clean_sys_ver = sys_obj.current_version.replace("v", "").strip()
            if clean_rec_ver != clean_sys_ver and not clean_sys_ver.startswith(clean_rec_ver):
                has_version_mismatch = True

        days_old = (now - (kr.updated_at or kr.created_at)).days

        reasons = []
        if has_version_mismatch:
            reasons.append(f"System Version Drift (Recorded: {recorded_version} vs Current: {current_version})")
        if kr.verification_status == "needs_review":
            reasons.append("Pending Initial Post-Mortem Verification")
        elif kr.verification_status == "outdated":
            reasons.append("Flagged Outdated by SRE Lead")
        elif days_old > 90:
            reasons.append(f"Aging Record ({days_old} days since last verification)")

        # Include in queue if there is any reason or status != verified or version mismatch
        if reasons or kr.verification_status != "verified" or has_version_mismatch:
            queue.append({
                "id": kr.id,
                "incident_id": kr.incident_id,
                "incident_title": inc.title if inc else kr.problem,
                "incident_severity": inc.severity if inc else "Medium",
                "system_name": system_name,
                "current_system_version": current_version,
                "recorded_version": recorded_version,
                "has_version_mismatch": has_version_mismatch,
                "verification_status": kr.verification_status,
                "days_since_update": days_old,
                "review_reasons": reasons,
                "review_reason_primary": reasons[0] if reasons else "Routine Review",
                "problem": kr.problem,
                "root_cause": kr.root_cause,
                "resolution": kr.resolution,
                "updated_at": kr.updated_at.isoformat() if kr.updated_at else None
            })

    # Sort queue: version mismatches and needs_review first
    queue.sort(key=lambda x: (not x["has_version_mismatch"], x["verification_status"] != "needs_review"))
    return queue
