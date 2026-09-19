import random
import uuid
from datetime import datetime, timedelta
from database import SessionLocal, init_db, engine, Base
from models import (
    User, System, Department, Incident, IncidentAction, 
    KnowledgeRecord, Source, IncidentEmbedding, IncidentCluster, KnowledgeGap
)
from services.embedding_service import generate_embedding


def generate_synthetic_data():
    print("Resetting database tables for fresh vector seeding...")
    Base.metadata.drop_all(bind=engine)
    init_db()
    db = SessionLocal()


    try:
        print("Starting synthetic dataset generation for OPS MEMORY...")

        # 1. Seed Departments
        dept_data = [
            ("Core Infrastructure", "INFRA"),
            ("FinTech & Payments", "PAY"),
            ("Authentication & Identity", "AUTH"),
            ("Data Platform & Analytics", "DATA"),
            ("Site Reliability Engineering", "SRE"),
        ]
        departments = []
        for name, code in dept_data:
            dept = db.query(Department).filter_by(code=code).first()
            if not dept:
                dept = Department(name=name, code=code)
                db.add(dept)
            departments.append(dept)
        db.commit()
        print(f"Seeded {len(departments)} departments.")

        # 2. Seed Systems
        sys_data = [
            ("Payment Gateway Service", "v2.4.1", "Handles credit card processing and merchant settlements"),
            ("PostgreSQL Main Cluster", "v16.2", "Primary relational database storing accounts and transactions"),
            ("Auth0 / Identity Provider", "v3.1.0", "OAuth2/OIDC authentication and JWT validation service"),
            ("Kafka Event Bus", "v3.6.0", "Distributed streaming platform for async event processing"),
            ("Redis Caching Layer", "v7.2.4", "In-memory session and response cache cluster"),
            ("Kubernetes Worker Nodes", "v1.29.1", "Core container orchestration cluster hosting microservices"),
            ("Ingress Gateway (NGINX)", "v1.9.5", "Edge proxy managing TLS termination and route distribution"),
            ("S3 Asset Storage", "v1.0.0", "Cloud object store for user uploads and system logs"),
        ]
        systems = []
        for name, ver, desc in sys_data:
            s = db.query(System).filter_by(name=name).first()
            if not s:
                s = System(name=name, current_version=ver, description=desc)
                db.add(s)
            systems.append(s)
        db.commit()
        print(f"Seeded {len(systems)} systems.")

        # 3. Seed Users
        user_roles = [
            ("Alex Chen", "alex.chen@opsmemory.internal", "Senior SRE Lead", "Site Reliability Engineering"),
            ("Sarah Jenkins", "sarah.j@opsmemory.internal", "Principal Database Administrator", "Core Infrastructure"),
            ("Marcus Vance", "marcus.v@opsmemory.internal", "DevOps Engineer", "Core Infrastructure"),
            ("Elena Rostova", "elena.r@opsmemory.internal", "Incident Commander", "Site Reliability Engineering"),
            ("David Kim", "david.k@opsmemory.internal", "FinTech Lead Engineer", "FinTech & Payments"),
            ("Priya Patel", "priya.p@opsmemory.internal", "Security Operations Specialist", "Authentication & Identity"),
        ]
        users = []
        for name, email, role, dept in user_roles:
            u = db.query(User).filter_by(email=email).first()
            if not u:
                u = User(name=name, email=email, role=role, department=dept)
                db.add(u)
            users.append(u)
        db.commit()
        print(f"Seeded {len(users)} users.")

        # 4. Templates for 250+ Synthetic Incidents
        # We will create 10 primary categories with rich semantic variations
        incident_templates = [
            # Category 1: Database Connection Pool Exhaustion
            {
                "category": "DB Pool Exhaustion",
                "system": "PostgreSQL Main Cluster",
                "department": "Core Infrastructure",
                "phrasings": [
                    ("PostgreSQL Connection Pool Exhausted During Checkout Peak",
                     "Checkout transactions experienced intermittent HTTP 500 failures because available database connections reached the maximum pool size of 200.",
                     "Database connection pool reached maximum capacity of 200 connections due to unclosed cursors in the checkout service worker loop."),
                    ("Database Max Connections Limit Reached on Main Replica",
                     "Applications were unable to acquire new DB sessions resulting in query timeout errors during high-volume promotional sale.",
                     "Active connections spike caused pool starvation; idle connections were not being reclaimed fast enough by PgBouncer."),
                    ("Intermittent Checkout Failures via Active Database Session Lockup",
                     "Users reported payment failures; server logs showed PostgreSQL error: FATAL: sorry, too many clients already.",
                     "PostgreSQL max_connections setting exceeded due to zombie background worker threads leaking DB handles.")
                ],
                "failed_attempt": "Attempted restarting application pods without clearing idle connections, which immediately re-exhausted the pool.",
                "remediation": "Updated max_connections to 500, deployed PgBouncer transaction pooling mode, and patched connection release block in checkout worker.",
                "tags": ["postgres", "pgvector", "pool", "timeout", "pgbouncer"]
            },
            # Category 2: Redis Cache Eviction & Stampede
            {
                "category": "Redis Eviction Surge",
                "system": "Redis Caching Layer",
                "department": "Core Infrastructure",
                "phrasings": [
                    ("Redis Cache Eviction Surge Causing Database Degradation",
                     "Cache hit ratio dropped from 99% to 40%, causing a sudden spike in direct database read traffic and elevated latency.",
                     "Volatile-lru eviction policy caused key eviction cascade when memory reached 95% threshold."),
                    ("Cache Memory Pressure Triggering Thundering Herd Problem",
                     "Session tokens were evicted prematurely, forcing 50,000 active users to re-authenticate against PostgreSQL simultaneously.",
                     "Lack of request coalescing on cache miss caused duplicate database lookups during traffic surge."),
                    ("Elevated API Latency due to Redis Memory Saturation",
                     "API gateway latency increased from 15ms to 1200ms following rapid eviction of cached product catalog items.",
                     "Large JSON objects stored without compression saturated Redis RAM limits.")
                ],
                "failed_attempt": "Attempted flushing cache keys manually, which aggravated the thundering herd load on the backend SQL database.",
                "remediation": "Scaled Redis cluster from 8GB to 32GB instances, configured maxmemory-policy allkeys-lru, and implemented probabilistic cache warming.",
                "tags": ["redis", "cache", "eviction", "latency", "stampede"]
            },
            # Category 3: Authentication & JWT Expiration
            {
                "category": "Auth JWT Failure",
                "system": "Auth0 / Identity Provider",
                "department": "Authentication & Identity",
                "phrasings": [
                    ("JWT RSA Public Key Rotation Caused Mass API 401 Unauthorized",
                     "API Gateway failed to validate incoming user tokens following automated JWKS key rotation by the identity provider.",
                     "JWKS key cache TTL was hardcoded to 24 hours, preventing key refresh when emergency rotation occurred."),
                    ("Authentication Gateway Rejecting Valid User Session Tokens",
                     "Single Sign-On (SSO) login requests failed globally with Invalid Signature errors across all mobile app clients.",
                     "Clock drift of 12 seconds between Auth microservice and NTP time servers invalidated token nbf (not-before) timestamp."),
                    ("SSO Token Verification Failure on Microservices Ingress",
                     "Distributed tracing showed auth middleware dropping 85% of incoming bearer tokens during peak morning login surge.",
                     "Token verification endpoint was overloaded due to lack of local public key caching.")
                ],
                "failed_attempt": "Restarted auth gateway without updating the JWKS public key cache, which failed to fix token verification.",
                "remediation": "Implemented dynamic JWKS cache invalidation on 401 response and configured chrony NTP synchronization across node pools.",
                "tags": ["auth", "jwt", "jwks", "sso", "ntp"]
            },
            # Category 4: Kafka Message Ingestion Backpressure & Lag
            {
                "category": "Kafka Lag Spike",
                "system": "Kafka Event Bus",
                "department": "Data Platform & Analytics",
                "phrasings": [
                    ("Kafka Message Consumer Group Lag Spike on Payment Events",
                     "Order fulfillment pipeline delayed by 45 minutes as consumer lag exceeded 1,200,000 unprocessed records on order-events topic.",
                     "Single-threaded consumer deserialization bottlenecked partition processing under heavy surge traffic."),
                    ("Event Stream Partition Imbalance Delays Notification Dispatch",
                     "Users did not receive email order confirmations for 2 hours due to hot partition hotspotting on Kafka cluster.",
                     "Poor partition key hashing strategy routed 70% of traffic to partition 0."),
                    ("Kafka Consumer Rebalance Loop Causing Stalled Processing",
                     "Frequent max.poll.interval.ms timeouts triggered continuous consumer group rebalances, halting processing.",
                     "Long-running DB operations inside message processing loop exceeded poll timeout.")
                ],
                "failed_attempt": "Increased consumer count without repartitioning the topic, resulting in idle consumer threads.",
                "remediation": "Expanded topic partitions from 4 to 16, enabled async batch processing in consumer code, and increased max.poll.interval.ms.",
                "tags": ["kafka", "lag", "consumer", "partition", "streaming"]
            },
            # Category 5: Kubernetes Pod OOM Kills
            {
                "category": "Kubernetes OOM Kills",
                "system": "Kubernetes Worker Nodes",
                "department": "Site Reliability Engineering",
                "phrasings": [
                    ("Kubernetes Pod Memory Limit Exceeded Triggering OOMKilled Loop",
                     "PDF generation microservice pods repeatedly crashed with exit code 137 (OOMKilled) when handling batch reports.",
                     "Uncapped memory buffer during multi-page PDF rendering exceeded the pod limit of 512Mi."),
                    ("Node Memory Starvation Causing Pod Eviction Cascade",
                     "Kubelet initiated pod evictions on worker-node-04 due to memory pressure from un-isolated background jobs.",
                     "Missing memory request and limit definitions allowed single pod to consume node RAM."),
                    ("Go Garbage Collection Delay Causing Pod CrashLoopBackOff",
                     "High throughput event parsing caused memory usage spike before Go runtime GC cycle triggered OOM kill.",
                     "GOGC environment variable was default 100, delaying garbage collection under burst memory allocations.")
                ],
                "failed_attempt": "Increased pod replica count, which caused additional nodes to experience memory starvation.",
                "remediation": "Increased container memory limit to 2Gi, configured GOMEMLIMIT environment variable, and added stream processing for PDF rendering.",
                "tags": ["k8s", "oom", "memory", "crashloop", "docker"]
            },
            # Category 6: Ingress SSL Certificate Expiration
            {
                "category": "SSL / DNS Ingress Failure",
                "system": "Ingress Gateway (NGINX)",
                "department": "Core Infrastructure",
                "phrasings": [
                    ("SSL Certificate Expiration Caused TLS Handshake Failures",
                     "Browsers displayed NET::ERR_CERT_DATE_INVALID warning on primary domain after cert-manager failed ACME challenge.",
                     "Cert-manager ACME HTTP-01 challenge path was blocked by new Cloudflare WAF firewall rule."),
                    ("NGINX Ingress Gateway Dropping Connections During TLS Renewal",
                     "External API clients received SSL handshake errors following certificate rotation.",
                     "Missing NGINX reload signal after secret update left old expired certificate in worker memory."),
                    ("DNS Resolution Degradation Causing Ingress Gateway Timeout",
                     "Internal CoreDNS latency increased to 2500ms, causing gateway upstream connection timeouts.",
                     "CoreDNS pod replicas were under-provisioned for internal DNS query load.")
                ],
                "failed_attempt": "Tried manually generating self-signed certificate, which untrusted production mobile clients.",
                "remediation": "Allowed ACME HTTP-01 challenge paths in Cloudflare WAF rules, automated post-renewal NGINX reloads, and scaled CoreDNS replicas to 6.",
                "tags": ["ssl", "ingress", "nginx", "dns", "cert-manager"]
            },
            # Category 7: Payment Gateway API Timeout & Rate Limits
            {
                "category": "Payment Gateway Failure",
                "system": "Payment Gateway Service",
                "department": "FinTech & Payments",
                "phrasings": [
                    ("Stripe Payment Provider HTTP 429 Rate Limit Exceeded",
                     "Merchant checkout failed for 15 minutes as upstream payment processor rejected API requests due to rate limits.",
                     "Retry loop without exponential backoff amplified request rate during temporary gateway hiccup."),
                    ("Payment Webhook Delivery Timeout Triggering Double Charges",
                     "Asynchronous payment confirmation webhooks timed out after 30s, causing user checkout retries.",
                     "Database lock during order creation delayed HTTP 200 response to payment processor webhook."),
                    ("3D Secure Authentication Handshake Degradation",
                     "International transactions failed 3DS verification step due to third-party ACS server latency timeouts.",
                     "Strict 5-second timeout on 3DS authorization call caused aggressive transaction cancellation.")
                ],
                "failed_attempt": "Disabling rate limit retries completely, which dropped legitimate failed payments without retry.",
                "remediation": "Implemented exponential backoff with jitter in Stripe client, moved webhook processing to background queue, and increased 3DS timeout to 15s.",
                "tags": ["payment", "stripe", "rate-limit", "webhook", "fintech"]
            },
            # Category 8: Cloud Storage S3 Throttling
            {
                "category": "S3 Storage Throttling",
                "system": "S3 Asset Storage",
                "department": "Core Infrastructure",
                "phrasings": [
                    ("S3 Bucket 503 SlowDown Throttling on Customer Document Uploads",
                     "Document ingestion pipeline failed with 503 SlowDown errors when writing 10,000 files per minute to single prefix.",
                     "S3 partition throughput limit of 3,500 PUT requests/sec was exceeded due to monolithic bucket folder structure."),
                    ("Object Storage Access Denied Following IAM Policy Update",
                     "User avatar uploads failed across all web clients with HTTP 403 Forbidden errors.",
                     "Overly restrictive IAM policy condition required kms:Decrypt permission that was omitted from app execution role."),
                    ("Large File Attachment Download Latency Spike",
                     "PDF invoice downloads degraded from 200ms to 8000ms during billing export run.",
                     "Direct S3 downloads bypassed CloudFront CDN distribution.")
                ],
                "failed_attempt": "Attempted increasing application upload thread pool, which aggravated AWS S3 rate limit throttling.",
                "remediation": "Introduced hash prefixing in S3 object keys (e.g. /bucket/a1/b2/filename.pdf) to distribute partition throughput and added CloudFront CDN caching.",
                "tags": ["s3", "aws", "storage", "iam", "cdn"]
            }
        ]

        severities = ["Critical", "High", "Medium", "Low"]
        statuses = ["Remediated", "Closed", "Investigating"]
        
        seeded_incidents_count = 0
        total_target_incidents = 255

        # We loop and generate 255 rich, realistic incidents
        for i in range(total_target_incidents):
            tpl = incident_templates[i % len(incident_templates)]
            phrasing = tpl["phrasings"][i % len(tpl["phrasings"])]
            
            # Find matching system and department
            target_sys = next((s for s in systems if s.name == tpl["system"]), systems[0])
            target_dept = next((d for d in departments if d.name == tpl["department"]), departments[0])
            target_user = random.choice(users)

            # Generate random timestamp within past 90 days
            days_ago = random.randint(0, 90)
            hours_ago = random.randint(0, 23)
            created_dt = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
            updated_dt = created_dt + timedelta(minutes=random.randint(15, 240))

            inc_id = f"INC-2026-{1000 + i}"
            title = f"{phrasing[0]} #{i+1}"
            description = f"{phrasing[1]} Detailed log snippet: [ERROR] {phrasing[2]}"

            inc = Incident(
                id=inc_id,
                title=title,
                description=description,
                system_id=target_sys.id,
                department_id=target_dept.id,
                severity=random.choice(severities) if i > 5 else ("Critical" if i % 2 == 0 else "High"),
                status=random.choice(statuses) if i > 10 else "Remediated",
                created_by=target_user.id,
                business_impact=f"Estimated impact: {random.randint(50, 5000)} user sessions affected during outage window.",
                created_at=created_dt,
                updated_at=updated_dt
            )
            db.add(inc)
            db.flush()

            # Add Incident Actions (Timeline)
            action1 = IncidentAction(
                incident_id=inc.id,
                action_text="Triggered PagerDuty alarm and initiated triage Slack channel.",
                result="neutral",
                notes="Incident commander assigned.",
                performed_by=target_user.id,
                timestamp=created_dt + timedelta(minutes=2)
            )
            action2 = IncidentAction(
                incident_id=inc.id,
                action_text=tpl["failed_attempt"],
                result="failed",
                notes="Hypothesis invalid; issue persisted.",
                performed_by=target_user.id,
                timestamp=created_dt + timedelta(minutes=15)
            )
            action3 = IncidentAction(
                incident_id=inc.id,
                action_text=tpl["remediation"],
                result="success",
                notes="Metrics stabilized and error rate dropped to 0%.",
                performed_by=target_user.id,
                timestamp=created_dt + timedelta(minutes=45)
            )
            db.add_all([action1, action2, action3])

            # Add Knowledge Record (Post-Mortem)
            kr = KnowledgeRecord(
                incident_id=inc.id,
                problem=phrasing[0],
                context=f"Occurred on system {target_sys.name} ({target_sys.current_version}) under department {target_dept.name}.",
                symptoms=phrasing[1],
                investigation_summary=f"SRE team investigated logs and identified {phrasing[2]}",
                failed_attempts=tpl["failed_attempt"],
                root_cause=phrasing[2],
                resolution=tpl["remediation"],
                outcome="Full service restoration and post-mortem review logged.",
                lessons_learned=f"Always configure proper timeouts, connection limits, and automated alerting for {', '.join(tpl['tags'])}.",
                verification_status="verified" if i % 3 != 0 else "needs_review",
                version_tag="v1.0",
                created_at=updated_dt,
                updated_at=updated_dt
            )
            db.add(kr)
            db.flush()

            # Add Source Evidence
            src = Source(
                knowledge_record_id=kr.id,
                incident_id=inc.id,
                file_name=f"post_mortem_{inc.id}.pdf",
                file_type="pdf",
                storage_path=f"/var/log/postmortems/{inc.id}.pdf",
                extracted_text=f"POST-MORTEM REPORT {inc.id}: {title}. Root cause: {phrasing[2]}. Remediation: {tpl['remediation']}",
                created_at=updated_dt
            )
            db.add(src)

            # Add Incident Embedding Chunk (Semantic vector payload)
            chunk_content = f"Incident {inc.id}: {title}. Symptoms: {phrasing[1]}. Root Cause: {phrasing[2]}. Resolution: {tpl['remediation']}"
            emb_vector = generate_embedding(chunk_content)
            emb = IncidentEmbedding(
                incident_id=inc.id,
                knowledge_record_id=kr.id,
                embedding_vector=emb_vector,
                chunk_text=chunk_content
            )
            db.add(emb)


            seeded_incidents_count += 1
            if seeded_incidents_count % 50 == 0:
                db.commit()
                print(f"Committed {seeded_incidents_count} / {total_target_incidents} incidents...")

        db.commit()

        # 5. Seed Incident Clusters
        clusters = [
            IncidentCluster(
                cluster_name="Database & Pool Exhaustion Cluster",
                description="Aggregated pattern of database connection starvation, pgvector timeouts, and max_connections limit breaches.",
                common_symptoms="HTTP 500 checkout errors, PostgreSQL max_connections exceeded, query timeout spikes.",
                occurrence_count=42
            ),
            IncidentCluster(
                cluster_name="Memory Saturation & Kubernetes OOM Cluster",
                description="Cluster of memory leaks, Go garbage collection delays, and pod exit code 137 OOMKilled events.",
                common_symptoms="Pod CrashLoopBackOff, container eviction, memory limit breach.",
                occurrence_count=35
            ),
            IncidentCluster(
                cluster_name="Authentication & Token Validation Cluster",
                description="Key rotation delays, JWKS cache TTL issues, and NTP clock drift causing 401 Unauthorized spikes.",
                common_symptoms="Mass 401 Unauthorized API failures, invalid JWT signature errors.",
                occurrence_count=28
            ),
        ]
        db.add_all(clusters)

        # 6. Seed Knowledge Gaps
        gaps = [
            KnowledgeGap(
                problem_pattern="PostgreSQL Vector Index Rebuilding Lock Contention",
                occurrences=8,
                documented_resolutions=1,
                coverage_status="partial"
            ),
            KnowledgeGap(
                problem_pattern="Kafka Consumer Partition Rebalance Loop under Heavy Payload",
                occurrences=12,
                documented_resolutions=0,
                coverage_status="uncovered"
            ),
            KnowledgeGap(
                problem_pattern="Redis Sentinel Failover Split-Brain during Network Partition",
                occurrences=5,
                documented_resolutions=3,
                coverage_status="resolved"
            )
        ]
        db.add_all(gaps)
        db.commit()

        print(f"SUCCESS! Fully seeded {seeded_incidents_count} operational incidents across 8 core systems.")
        print(f"Generated associated actions, post-mortems, embeddings, clusters, and knowledge gaps.")

    except Exception as e:
        db.rollback()
        print(f"Error during synthetic data generation: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    generate_synthetic_data()
