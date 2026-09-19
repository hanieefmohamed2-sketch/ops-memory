import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlusCircle, 
  ArrowLeft, 
  Sparkles, 
  User, 
  RefreshCw,
  Send,
  FileCheck,
  Edit3,
  X,
  Shield,
  ShieldCheck
} from 'lucide-react';

interface ActionItem {
  id: string;
  action_text: string;
  result: 'success' | 'failed' | 'neutral';
  notes?: string;
  performed_by: string;
  timestamp: string;
}

interface FailedSolution {
  historical_incident_id: string;
  historical_title: string;
  similarity_score: number;
  failed_attempt: string;
  why_failed: string;
}

interface KnowledgeRecordDetail {
  problem: string;
  context: string;
  symptoms: string;
  investigation_summary?: string;
  failed_attempts?: string;
  root_cause: string;
  resolution: string;
  outcome?: string;
  lessons_learned?: string;
  verification_status: string;
}

interface IncidentDetail {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  business_impact: string;
  system_name: string;
  system_version: string;
  department_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  knowledge_record?: KnowledgeRecordDetail;
  actions_timeline: ActionItem[];
  failed_solutions_memory: FailedSolution[];
}

export const InvestigationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || 'INC-2026-1000';

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Action Logger Form State
  const [actionText, setActionText] = useState('');
  const [actionResult, setActionResult] = useState<'success' | 'failed' | 'neutral'>('neutral');
  const [actionNotes, setActionNotes] = useState('');
  const [isLoggingAction, setIsLoggingAction] = useState(false);

  // Resolution Capture State
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resRootCause, setResRootCause] = useState('');
  const [resResolution, setResResolution] = useState('');
  const [resOutcome, setResOutcome] = useState('');
  const [resLessons, setResLessons] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Human Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyForm, setVerifyForm] = useState<KnowledgeRecordDetail>({
    problem: '',
    context: '',
    symptoms: '',
    investigation_summary: '',
    failed_attempts: '',
    root_cause: '',
    resolution: '',
    outcome: '',
    lessons_learned: '',
    verification_status: 'needs_review'
  });

  const fetchIncidentDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/incidents/${incidentId}`);
      if (res.data.status === 'success') {
        const data = res.data.data;
        setIncident(data);
        if (data.knowledge_record) {
          setVerifyForm({
            problem: data.knowledge_record.problem || data.title,
            context: data.knowledge_record.context || `Occurred on ${data.system_name}`,
            symptoms: data.knowledge_record.symptoms || '',
            investigation_summary: data.knowledge_record.investigation_summary || '',
            failed_attempts: data.knowledge_record.failed_attempts || '',
            root_cause: data.knowledge_record.root_cause || '',
            resolution: data.knowledge_record.resolution || '',
            outcome: data.knowledge_record.outcome || 'Service fully restored',
            lessons_learned: data.knowledge_record.lessons_learned || '',
            verification_status: data.knowledge_record.verification_status || 'needs_review'
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch incident details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [incidentId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    if (newStatus === 'Resolved') {
      setShowResolveForm(true);
      return;
    }
    try {
      setStatusUpdating(true);
      await axios.patch(`http://localhost:8000/api/incidents/${incident.id}/status`, {
        status: newStatus
      });
      setIncident({ ...incident, status: newStatus });
      fetchIncidentDetail();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionText.trim() || !incident) return;

    try {
      setIsLoggingAction(true);
      const res = await axios.post(`http://localhost:8000/api/incidents/${incident.id}/actions`, {
        action_text: actionText,
        result: actionResult,
        notes: actionNotes
      });

      if (res.data.status === 'success') {
        setActionText('');
        setActionNotes('');
        setActionResult('neutral');
        fetchIncidentDetail();
      }
    } catch (err) {
      console.error('Failed to record action:', err);
    } finally {
      setIsLoggingAction(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resRootCause.trim() || !resResolution.trim() || !incident) return;

    try {
      setIsResolving(true);
      const res = await axios.post(`http://localhost:8000/api/incidents/${incident.id}/resolve`, {
        root_cause: resRootCause,
        resolution: resResolution,
        outcome: resOutcome || '100% service recovery achieved',
        lessons_learned: resLessons
      });

      if (res.data.status === 'success') {
        const sk = res.data.data.structured_knowledge;
        setVerifyForm({
          ...sk,
          verification_status: 'needs_review'
        });
        setIsResolving(false);
        setShowResolveForm(false);
        setShowVerifyModal(true);
        fetchIncidentDetail();
      }
    } catch (err) {
      console.error('Resolution submission failed:', err);
      setIsResolving(false);
    }
  };

  const handleHumanVerification = async (targetStatus: 'verified' | 'needs_review') => {
    if (!incident) return;

    try {
      setVerifying(true);
      const res = await axios.post(`http://localhost:8000/api/knowledge/${incident.id}/verify`, {
        ...verifyForm,
        verification_status: targetStatus
      });

      if (res.data.status === 'success') {
        setVerifying(false);
        setShowVerifyModal(false);
        fetchIncidentDetail();
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-16 rounded-3xl border border-[#efeae1] text-center space-y-3 shadow-xs">
        <RefreshCw className="w-10 h-10 text-[#ff3b30] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-stone-700">Loading SRE Investigation Workspace...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-4 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-[#ff3b30] mx-auto" />
        <p className="text-xl font-bold text-stone-900">Incident {incidentId} not found.</p>
        <Link to="/incidents" className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-xs font-semibold inline-block">
          Return to Incidents Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/incidents"
          className="text-xs font-semibold text-stone-600 hover:text-[#ff3b30] flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents Archive</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
          <span>Incident Ref:</span>
          <span className="font-mono font-bold text-[#ff3b30]">{incident.id}</span>
        </div>
      </div>

      {/* Header Overview Card */}
      <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#efeae1] pb-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-[#ff3b30] bg-[#fff5f5] px-3 py-1 rounded-full border border-[#ffe0e0]">
                {incident.id}
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                incident.severity === 'Critical' ? 'bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]' :
                incident.severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {incident.severity}
              </span>
              <span className="text-xs text-stone-500 font-medium">{incident.system_name} ({incident.system_version})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">{incident.title}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowResolveForm(true)}
              className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
            >
              <FileCheck className="w-4 h-4 text-[#ff3b30]" />
              <span>Resolve & Capture Knowledge</span>
            </button>

            <div className="flex items-center space-x-2 bg-[#fcfaf7] p-2 rounded-full border border-[#efeae1]">
              <span className="text-xs font-semibold text-stone-500 pl-2">Status:</span>
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className="bg-white border border-[#efeae1] rounded-full px-4 py-1.5 text-xs font-bold text-stone-900 focus:outline-none"
              >
                <option value="New">New</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              {statusUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff3b30]" />}
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-5 rounded-2xl border border-[#efeae1] font-medium">
          {incident.description}
        </p>
      </div>

      {/* FAILED SOLUTION MEMORY WARNING BOX */}
      {incident.failed_solutions_memory && incident.failed_solutions_memory.length > 0 && (
        <div className="bg-[#fff5f5] p-6 rounded-3xl border border-[#ffe0e0] space-y-4 shadow-xs">
          <div className="flex items-center space-x-3 text-[#ff3b30]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Failed Solution Memory Warning — Do Not Repeat
            </h2>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed font-medium">
            AI vector memory identified <strong>{incident.failed_solutions_memory.length} remediation attempts</strong> that previously failed in similar historical incidents:
          </p>

          <div className="space-y-3">
            {incident.failed_solutions_memory.map((fs, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white border border-[#ffe0e0] flex items-start space-x-3 text-xs">
                <XCircle className="w-4 h-4 text-[#ff3b30] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-900">{fs.failed_attempt}</p>
                  <p className="text-[11px] text-stone-600 font-medium">{fs.why_failed} (Reference: {fs.historical_incident_id})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Capture Form Drawer */}
      {showResolveForm && (
        <form onSubmit={handleResolveSubmit} className="bg-white p-8 rounded-3xl border border-emerald-200 bg-emerald-50/20 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-base">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Resolution Capture & Post-Mortem Inputs</span>
            </div>
            <button type="button" onClick={() => setShowResolveForm(false)} className="text-stone-400 hover:text-stone-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900">Verified Root Cause *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Unclosed PostgreSQL cursors in checkout worker caused max_connections pool limit breach..."
                value={resRootCause}
                onChange={(e) => setResRootCause(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-2xl p-4 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900">Final Remediation Steps *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Deployed PgBouncer transaction pooling mode and updated max_connections to 500..."
                value={resResolution}
                onChange={(e) => setResResolution(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-2xl p-4 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900">Outcome & Recovery Status</label>
              <input
                type="text"
                placeholder="e.g. 100% service recovery achieved with active DB connection pool stabilizing at 120"
                value={resOutcome}
                onChange={(e) => setResOutcome(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900">Lessons Learned & Preventive Action</label>
              <input
                type="text"
                placeholder="e.g. Add automated PagerDuty alarm when PgBouncer pool utilization exceeds 80%"
                value={resLessons}
                onChange={(e) => setResLessons(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowResolveForm(false)}
              className="px-5 py-2.5 bg-[#fcfaf7] text-stone-800 border border-[#efeae1] rounded-full text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResolving}
              className="px-7 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-2"
            >
              {isResolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff3b30]" /> : <Sparkles className="w-3.5 h-3.5 text-[#ff3b30]" />}
              <span>Generate AI Knowledge Record</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Action Logger & Timeline (Left) vs Historical Knowledge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Action Logger & Chronological Timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Action Logger Form */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#ff3b30]" />
                <span>Log Investigation Step</span>
              </h2>
              <span className="text-[10px] text-stone-400 font-medium">Records real-time SRE triage actions</span>
            </div>

            <form onSubmit={handleLogAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900">Action Performed *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Increased PgBouncer pool size from 200 to 500 and restarted checkout worker pods"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Outcome Result</label>
                  <select
                    value={actionResult}
                    onChange={(e) => setActionResult(e.target.value as any)}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
                  >
                    <option value="neutral">Neutral (Investigation / Observation)</option>
                    <option value="success">Success (Issue Resolved / Improved)</option>
                    <option value="failed">Failed (Action Failed / No Improvement)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900">Technical Notes / Output</label>
                  <input
                    type="text"
                    placeholder="e.g. Error rate dropped to 0%; active sessions stabilized at 120"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isLoggingAction}
                  className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
                >
                  {isLoggingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff3b30]" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Record Action Step</span>
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Action Timeline */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#ff3b30]" />
                <span>Chronological Action Timeline ({incident.actions_timeline.length})</span>
              </h2>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Oldest to Newest</span>
            </div>

            {incident.actions_timeline.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6 font-medium">No investigation steps logged yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#efeae1]">
                {incident.actions_timeline.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      act.result === 'success' ? 'bg-emerald-500 text-white' :
                      act.result === 'failed' ? 'bg-[#ff3b30] text-white' :
                      'bg-stone-300 text-stone-700'
                    }`}>
                      {act.result === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                       act.result === 'failed' ? <XCircle className="w-3.5 h-3.5" /> :
                       <Clock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">{act.action_text}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          act.result === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          act.result === 'failed' ? 'bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]' :
                          'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {act.result}
                        </span>
                      </div>

                      {act.notes && (
                        <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-[#efeae1] font-mono font-medium">
                          {act.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 font-medium">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{act.performed_by}</span>
                        </span>
                        <span className="font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Knowledge Record & Human Verification Status */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ff3b30]" />
                <span>Knowledge Record</span>
              </h2>

              {incident.knowledge_record && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="px-3 py-1 bg-[#fcfaf7] text-stone-800 border border-[#efeae1] rounded-full text-[11px] font-semibold flex items-center space-x-1 shadow-2xs"
                >
                  <Edit3 className="w-3 h-3 text-[#ff3b30]" />
                  <span>Verify</span>
                </button>
              )}
            </div>

            {incident.knowledge_record ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fcfaf7] border border-[#efeae1]">
                  <span className="text-stone-500 font-medium">Verification Status:</span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                    incident.knowledge_record.verification_status === 'verified'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {incident.knowledge_record.verification_status === 'verified' ? '✓ Verified & Current' : 'Needs Review'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Identified Root Cause</span>
                  <p className="text-stone-900 font-semibold">{incident.knowledge_record.root_cause}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Verified Resolution</span>
                  <p className="text-emerald-700 font-semibold">{incident.knowledge_record.resolution}</p>
                </div>

                {incident.knowledge_record.lessons_learned && (
                  <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Lessons Learned</span>
                    <p className="text-stone-800 font-medium">{incident.knowledge_record.lessons_learned}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-stone-400 italic font-medium">No post-mortem record generated yet.</p>
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="px-4 py-2 bg-[#111111] text-white rounded-full text-xs font-semibold shadow-md"
                >
                  + Capture Resolution & Post-Mortem
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review & Verify AI Knowledge Record Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-[#efeae1] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Human Verification & Post-Mortem Approval</h3>
                  <p className="text-xs text-stone-500 font-medium">Inspect, edit, and verify the AI-structured knowledge record before committing to vector memory</p>
                </div>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Core Problem Statement</label>
                  <input
                    type="text"
                    value={verifyForm.problem}
                    onChange={(e) => setVerifyForm({ ...verifyForm, problem: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-stone-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Observed Symptoms</label>
                  <input
                    type="text"
                    value={verifyForm.symptoms}
                    onChange={(e) => setVerifyForm({ ...verifyForm, symptoms: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-stone-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Verified Root Cause</label>
                <textarea
                  rows={2}
                  value={verifyForm.root_cause}
                  onChange={(e) => setVerifyForm({ ...verifyForm, root_cause: e.target.value })}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-2xl p-3.5 text-xs text-amber-700 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Final Resolution Steps</label>
                <textarea
                  rows={2}
                  value={verifyForm.resolution}
                  onChange={(e) => setVerifyForm({ ...verifyForm, resolution: e.target.value })}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-2xl p-3.5 text-xs text-emerald-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Failed Remediation Attempts</label>
                  <input
                    type="text"
                    value={verifyForm.failed_attempts}
                    onChange={(e) => setVerifyForm({ ...verifyForm, failed_attempts: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-[#ff3b30] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Lessons Learned</label>
                  <input
                    type="text"
                    value={verifyForm.lessons_learned}
                    onChange={(e) => setVerifyForm({ ...verifyForm, lessons_learned: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-stone-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#efeae1] flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification commits record to permanent vector RAG memory</span>
              </span>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleHumanVerification('needs_review')}
                  disabled={verifying}
                  className="px-5 py-2.5 bg-[#fcfaf7] hover:bg-stone-100 border border-[#efeae1] text-stone-800 rounded-full text-xs font-semibold"
                >
                  Save as Needs Review
                </button>
                <button
                  type="button"
                  onClick={() => handleHumanVerification('verified')}
                  disabled={verifying}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-2"
                >
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin text-[#ff3b30]" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <span>Verify & Save to Operational Memory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
