import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Server, 
  Building, 
  User, 
  Calendar, 
  FileText, 
  X, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface TimelineAction {
  id: string;
  action_text: string;
  result: 'success' | 'failed' | 'neutral' | string;
  notes?: string;
  performed_by: string;
  timestamp?: string;
}

interface SourceDoc {
  id: string;
  file_name: string;
  file_type: string;
  storage_path?: string;
  extracted_text: string;
  created_at?: string;
}

interface RelatedRecord {
  id: string;
  incident_id: string;
  title: string;
  severity: string;
  verification_status: string;
  problem: string;
  root_cause: string;
}

interface KnowledgeDetail {
  id: string;
  incident_id: string;
  incident_title: string;
  incident_description?: string;
  incident_severity: string;
  incident_status: string;
  system_name: string;
  current_system_version?: string;
  has_version_mismatch?: boolean;
  department_name: string;
  creator_name: string;
  created_at?: string;
  updated_at?: string;
  problem: string;
  context?: string;
  symptoms?: string;
  investigation_summary?: string;
  failed_attempts?: string;
  root_cause: string;
  resolution: string;
  outcome?: string;
  lessons_learned?: string;
  verification_status: 'verified' | 'needs_review' | 'outdated' | string;
  version_tag: string;
  actions_timeline: TimelineAction[];
  sources: SourceDoc[];
  related_records: RelatedRecord[];
}

export const KnowledgeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<KnowledgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceDoc | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    axios.get(`http://localhost:8000/api/knowledge/${id}`)
      .then(res => {
        setRecord(res.data.data);
      })
      .catch(err => {
        console.error("Failed to load knowledge record detail:", err);
        setError("Knowledge record not found or server error.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-3xl border border-[#efeae1] text-center space-y-3 shadow-xs">
        <RefreshCw className="w-10 h-10 text-[#ff3b30] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-stone-700">Loading post-mortem knowledge record...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-4 shadow-xs">
        <AlertCircle className="w-12 h-12 text-[#ff3b30] mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Record Not Found</h2>
        <p className="text-xs text-stone-500">{error || "Could not retrieve post-mortem detail."}</p>
        <button
          onClick={() => navigate('/knowledge')}
          className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-xs font-semibold"
        >
          Return to Knowledge Explorer
        </button>
      </div>
    );
  }

  const renderVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Human Verified Post-Mortem</span>
          </span>
        );
      case 'outdated':
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Outdated Record</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Navigation & Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/knowledge')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-stone-600 hover:text-[#ff3b30] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Knowledge Explorer</span>
        </button>

        <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#efeae1] pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-[#ff3b30]">{record.incident_id}</span>
                {renderVerificationBadge(record.verification_status)}
                <span className="text-xs font-mono px-3 py-0.5 rounded-full bg-[#fcfaf7] text-stone-600 border border-[#efeae1] font-medium">
                  {record.version_tag}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight pt-1">
                {record.incident_title}
              </h1>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                record.incident_severity === 'Critical' ? 'bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]' :
                record.incident_severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {record.incident_severity} Severity
              </span>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#fcfaf7] text-stone-800 border border-[#efeae1]">
                Status: {record.incident_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-stone-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">System</p>
                <p className="font-bold text-stone-900">{record.system_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#fcfaf7] text-stone-600 flex items-center justify-center border border-[#efeae1]">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Department</p>
                <p className="font-bold text-stone-900">{record.department_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#fcfaf7] text-stone-600 flex items-center justify-center border border-[#efeae1]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Created By</p>
                <p className="font-bold text-stone-900">{record.creator_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#fcfaf7] text-stone-600 flex items-center justify-center border border-[#efeae1]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Updated At</p>
                <p className="font-bold text-stone-900">
                  {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 9-Part Post-Mortem Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): 9-Part Post-Mortem Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Version Drift Warning Banner */}
          {(record.has_version_mismatch || (record.current_system_version && record.version_tag && !record.current_system_version.includes(record.version_tag.replace('v', '')))) && (
            <div className="bg-[#fff5f5] p-6 rounded-3xl border border-[#ffe0e0] flex items-start space-x-4 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-[#ff3b30] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-[#ff3b30] uppercase tracking-wider">
                  ⚠️ System Version Drift Warning
                </h4>
                <p className="text-stone-700 leading-relaxed font-medium">
                  This post-mortem was recorded for <strong>{record.system_name}</strong> (recorded release: <span className="font-mono">{record.version_tag}</span>), but the current production system has been upgraded to <span className="font-mono text-[#ff3b30] font-bold">{record.current_system_version || 'v2.4.1'}</span>.
                  Operational procedures, configurations, or underlying APIs may have evolved. Verify against active codebase before applying remediation.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Problem Statement */}
          <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#ff3b30] uppercase tracking-wider">
              1. Problem Statement
            </h3>
            <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-4 rounded-2xl border border-[#efeae1] font-medium">
              {record.problem}
            </p>
          </div>

          {/* Section 2: Context & Operational Environment */}
          {record.context && (
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                2. Context & Operational Environment
              </h3>
              <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-4 rounded-2xl border border-[#efeae1] font-medium">
                {record.context}
              </p>
            </div>
          )}

          {/* Section 3: Observed Symptoms */}
          {record.symptoms && (
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                3. Observed Symptoms
              </h3>
              <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-4 rounded-2xl border border-[#efeae1] font-medium">
                {record.symptoms}
              </p>
            </div>
          )}

          {/* Section 4: Investigation Summary */}
          {record.investigation_summary && (
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                4. Investigation Summary
              </h3>
              <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-4 rounded-2xl border border-[#efeae1] font-medium">
                {record.investigation_summary}
              </p>
            </div>
          )}

          {/* Section 5: FAILED SOLUTION MEMORY (Red Warning Highlight Box!) */}
          {record.failed_attempts && (
            <div className="bg-[#fff5f5] p-6 rounded-3xl border border-[#ffe0e0] space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-[#ff3b30]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  5. Failed Solution Memory (Do Not Repeat!)
                </h3>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed bg-white p-4 rounded-2xl border border-[#ffe0e0] font-semibold">
                {record.failed_attempts}
              </p>
            </div>
          )}

          {/* Section 6: Root Cause Analysis */}
          <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              6. Root Cause Analysis
            </h3>
            <p className="text-xs text-stone-800 leading-relaxed bg-[#fcfaf7] p-4 rounded-2xl border border-[#efeae1] font-medium">
              {record.root_cause}
            </p>
          </div>

          {/* Section 7: Final Resolution & Fix */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>7. Final Resolution & Permanent Fix</span>
            </h3>
            <p className="text-xs text-stone-800 leading-relaxed bg-white p-4 rounded-2xl border border-emerald-100 font-medium">
              {record.resolution}
            </p>
          </div>

          {/* Section 8 & 9: Outcome & Lessons Learned */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {record.outcome && (
              <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  8. Measurable Outcome
                </h3>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {record.outcome}
                </p>
              </div>
            )}

            {record.lessons_learned && (
              <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  9. Organizational Lessons Learned
                </h3>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {record.lessons_learned}
                </p>
              </div>
            )}
          </div>

          {/* Action Log Timeline Section */}
          {record.actions_timeline && record.actions_timeline.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                SRE Investigation Action Log ({record.actions_timeline.length} actions)
              </h3>
              <div className="space-y-3">
                {record.actions_timeline.map((act) => (
                  <div key={act.id} className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {act.result === 'success' ? (
                          <span className="flex items-center text-emerald-700 font-bold text-[10px] gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SUCCESS
                          </span>
                        ) : act.result === 'failed' ? (
                          <span className="flex items-center text-[#ff3b30] font-bold text-[10px] gap-1">
                            <XCircle className="w-3.5 h-3.5 text-[#ff3b30]" /> FAILED
                          </span>
                        ) : (
                          <span className="flex items-center text-stone-500 font-bold text-[10px] gap-1">
                            <HelpCircle className="w-3.5 h-3.5" /> NEUTRAL
                          </span>
                        )}
                        <span className="text-stone-500">• {act.performed_by}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 font-medium">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-stone-900 font-semibold">{act.action_text}</p>
                    {act.notes && (
                      <p className="text-[11px] text-stone-600 italic bg-white p-2.5 rounded-xl border border-[#efeae1]">
                        Notes: {act.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Source Documents & Related Records */}
        <div className="space-y-6">
          {/* Source Documents Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#ff3b30] uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#ff3b30]" />
              <span>Source Evidence Attachments ({record.sources.length})</span>
            </h3>

            {record.sources.length === 0 ? (
              <p className="text-xs text-stone-400 italic font-medium">No external document files attached to this post-mortem.</p>
            ) : (
              <div className="space-y-3">
                {record.sources.map((src) => (
                  <div key={src.id} className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-xs truncate max-w-[150px]">{src.file_name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0] font-bold">
                        {src.file_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedSource(src)}
                      className="w-full py-2 bg-white hover:bg-stone-100 text-stone-900 border border-[#efeae1] rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#ff3b30]" />
                      <span>Inspect Extracted Text</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Knowledge Records Sidebar */}
          {record.related_records && record.related_records.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#ff3b30]" />
                <span>Related System Post-Mortems</span>
              </h3>
              <div className="space-y-3">
                {record.related_records.map((rel) => (
                  <div key={rel.id} className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2 text-xs hover:border-[#ff3b30]/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#ff3b30]">{rel.incident_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-stone-700 font-bold border border-[#efeae1]">
                        {rel.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 line-clamp-1">{rel.title}</h4>
                    <p className="text-[11px] text-stone-600 line-clamp-2 font-medium">{rel.problem}</p>
                    <button
                      onClick={() => navigate(`/knowledge/${rel.id}`)}
                      className="text-[10px] text-[#ff3b30] hover:underline flex items-center space-x-1 pt-1 font-bold"
                    >
                      <span>Open Record</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source Document Reader Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#efeae1] p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900">{selectedSource.file_name}</h4>
                  <p className="text-xs text-stone-500 font-medium">Attached Source Document Evidence</p>
                </div>
              </div>
              <button onClick={() => setSelectedSource(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between text-xs text-stone-600 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] font-medium">
                <span>File Format: <strong className="text-[#ff3b30] uppercase">{selectedSource.file_type}</strong></span>
                <span className="font-mono text-[11px] text-stone-500">{selectedSource.storage_path || 'attached_evidence'}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Extracted Document Text Excerpt</label>
                <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] font-mono text-[11px] leading-relaxed text-stone-800 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {selectedSource.extracted_text}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-xs font-semibold shadow-md"
              >
                Close Document Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
