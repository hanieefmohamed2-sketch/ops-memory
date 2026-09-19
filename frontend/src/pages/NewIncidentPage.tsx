import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  ArrowRight,
  X,
  FileText,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SystemItem {
  id: string;
  name: string;
}

interface DepartmentItem {
  id: string;
  name: string;
}

interface AIExtractedData {
  problem: string;
  symptoms: string[];
  system: string;
  context: string;
  potential_component: string;
  incident_type: string;
  keywords: string[];
}

interface SourceMeta {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  extracted_text: string;
}

interface SimilarIncidentItem {
  incident_id: string;
  title: string;
  similarity_score: number;
  freshness_status: string;
  severity: string;
  status: string;
  system_name: string;
  department_name: string;
  problem: string;
  symptoms: string;
  root_cause: string;
  resolution: string;
  relevance_explanation: string;
  relevance_checklist: string[];
  source_metadata: SourceMeta[];
  created_at: string;
}

export const NewIncidentPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemId, setSystemId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [severity, setSeverity] = useState('High');
  const [tags, setTags] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');

  // Dropdown Lists
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  // AI & Vector Search State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [extractedData, setExtractedData] = useState<AIExtractedData | null>(null);
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncidentItem[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Source Evidence Viewer Drawer State
  const [selectedSource, setSelectedSource] = useState<{ incTitle: string; doc: SourceMeta } | null>(null);

  // Submit & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sysRes, deptRes] = await Promise.all([
          axios.get('http://localhost:8000/api/systems'),
          axios.get('http://localhost:8000/api/departments')
        ]);
        setSystems(sysRes.data);
        setDepartments(deptRes.data);
        if (sysRes.data.length > 0) setSystemId(sysRes.data[0].id);
        if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);
      } catch {
        setSystems([
          { id: '1', name: 'PostgreSQL Main Cluster' },
          { id: '2', name: 'Payment Gateway Service' },
          { id: '3', name: 'Auth0 / Identity Provider' },
          { id: '4', name: 'Kafka Event Bus' },
          { id: '5', name: 'Redis Caching Layer' },
        ]);
        setDepartments([
          { id: '1', name: 'Core Infrastructure' },
          { id: '2', name: 'FinTech & Payments' },
          { id: '3', name: 'Authentication & Identity' },
          { id: '4', name: 'Site Reliability Engineering' },
        ]);
      }
    };
    fetchData();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please enter a natural-language incident description to analyze.');
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);
    setAnalysisStep(1);

    try {
      setTimeout(() => setAnalysisStep(2), 500);
      setTimeout(() => setAnalysisStep(3), 1000);

      const [aiRes, searchRes] = await Promise.all([
        axios.post('http://localhost:8000/api/incidents/analyze', { description, title }),
        axios.post('http://localhost:8000/api/search/similar', { query: `${title} ${description}`, limit: 3 })
      ]);

      if (aiRes.data.status === 'success') {
        setTimeout(() => {
          setExtractedData(aiRes.data.data);
          setSimilarIncidents(searchRes.data.results || []);
          setIsAnalyzing(false);
          setShowPreviewModal(true);
        }, 1400);
      }
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.response?.data?.detail || 'AI Extraction Service temporarily unavailable.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/incidents', {
        title: title,
        description: description,
        system_id: systemId,
        department_id: departmentId,
        severity: severity,
        business_impact: businessImpact || 'Under evaluation by SRE on-call team.',
        tags: tags
      });

      if (response.data.status === 'success') {
        setIsSubmitting(false);
        setShowPreviewModal(false);
        setSuccessMessage(`Incident ${response.data.data.id} created successfully with status 'New'!`);
        setTimeout(() => {
          navigate('/incidents');
        }, 2000);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.response?.data?.detail || 'Database write failed. Please check network connection.');
    }
  };

  return (
    <div className="max-w-[1350px] mx-auto space-y-8 pb-16">

      {/* Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Incident Intake & Relevance Search Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Log operational <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">incident.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Input natural language descriptions. AI extracts symptoms, queries vector embeddings, and generates relevance verification checklists.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#fcfaf7] border border-[#efeae1] text-stone-700 text-xs font-semibold shrink-0">
          <Cpu className="w-4 h-4 text-[#ff3b30]" />
          <span>pgvector RAG Active</span>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#fff5f5] border border-[#ffe0e0] text-rose-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-stone-400 hover:text-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-stone-900">{successMessage}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Redirecting to Incidents Archive...</p>
          </div>
        </div>
      )}

      {/* Intake Form */}
      <form onSubmit={handleAnalyze} className="bg-white p-8 md:p-10 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
              <span>Incident Title *</span>
              <span className="text-[10px] text-stone-400 font-medium">Operational headline</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Payment Gateway HTTP 504 Timeouts during Checkout Surge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900">Severity Level *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
            >
              <option value="Critical">Critical (P0 Outage)</option>
              <option value="High">High (P1 Degradation)</option>
              <option value="Medium">Medium (P2 Partial)</option>
              <option value="Low">Low (P3 Minor Alert)</option>
            </select>
          </div>
        </div>

        {/* Natural Language Description Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" />
              <span>Natural-Language Incident Description *</span>
            </span>
            <span className="text-[10px] text-[#ff3b30] font-bold">Triggers vector similarity & post-mortem matching</span>
          </label>
          <textarea
            rows={5}
            required
            placeholder="Describe what occurred in plain text... e.g. Around 14:20 UTC, users reported payment failures on checkout. Server logs showed PostgreSQL active sessions reached 200/200 max_connections due to unreleased handles in checkout worker..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-3xl p-5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] leading-relaxed font-medium"
          />
        </div>

        {/* Metadata Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900">Affected System</label>
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
            >
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900">Responsible Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-900">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. postgres, checkout, timeout"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-900">Business Impact & Scope</label>
          <input
            type="text"
            placeholder="e.g. Estimated 1,500 checkout transactions impacted across EU region."
            value={businessImpact}
            onChange={(e) => setBusinessImpact(e.target.value)}
            className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-5 py-3.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
          />
        </div>

        {/* Loading Progress State */}
        {isAnalyzing && (
          <div className="p-5 rounded-2xl bg-[#fff5f5] border border-[#ffe0e0] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#ff3b30]" />
                <span>
                  {analysisStep === 1 && "Step 1/3: Running LLM Natural Language Extraction..."}
                  {analysisStep === 2 && "Step 2/3: Executing pgvector Cosine Distance Search..."}
                  {analysisStep === 3 && "Step 3/3: Synthesizing Relevance Explanations & Checklists..."}
                </span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Processing...</span>
            </div>
            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#ffe0e0]">
              <div
                className="h-full bg-[#ff3b30] transition-all duration-500"
                style={{ width: `${(analysisStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 flex items-center justify-between border-t border-[#efeae1]">
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting || isAnalyzing}
            className="px-6 py-3 bg-[#fcfaf7] hover:bg-stone-100 text-stone-800 border border-[#efeae1] rounded-full text-xs font-semibold transition-colors flex items-center space-x-2 shadow-2xs"
          >
            <Save className="w-4 h-4 text-stone-500" />
            <span>Save Directly Without AI</span>
          </button>

          <button
            type="submit"
            disabled={isAnalyzing || isSubmitting}
            className="px-8 py-3.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#ff3b30]" />
            <span>Analyze & Query Similar Incidents</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </form>

      {/* AI Extraction Preview Modal */}
      {showPreviewModal && extractedData && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-[#efeae1] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">AI Analysis & RAG Similar Incidents Explorer</h3>
                  <p className="text-xs text-stone-500 font-medium">Structured extraction + vector similarity retrieval across historical post-mortems</p>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-stone-400 hover:text-stone-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#ff3b30] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>Extracted Incident Structure</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Core Problem Summary</label>
                  <input
                    type="text"
                    value={extractedData.problem}
                    onChange={(e) => setExtractedData({ ...extractedData, problem: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-stone-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Potential Component</label>
                  <input
                    type="text"
                    value={extractedData.potential_component}
                    onChange={(e) => setExtractedData({ ...extractedData, potential_component: e.target.value })}
                    className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full p-3 text-xs text-amber-700 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Similar Incidents Vector Retrieval Section */}
            <div className="space-y-4 pt-4 border-t border-[#efeae1]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#ff3b30]" />
                  <span>Top Relevant Historical Incidents ({similarIncidents.length})</span>
                </h4>
                <span className="text-[10px] text-stone-400 font-medium">Ranked by pgvector cosine similarity</span>
              </div>

              {similarIncidents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] text-center text-xs text-stone-500 space-y-1">
                  <HelpCircle className="w-6 h-6 text-stone-400 mx-auto" />
                  <p className="font-bold text-stone-900">No sufficiently relevant historical incident found</p>
                  <p className="text-[11px] text-stone-500">Vector similarity score threshold &gt; 35%. Unique operational anomaly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {similarIncidents.map((item) => (
                    <div key={item.incident_id} className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-3 hover:border-[#ff3b30]/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-mono font-bold text-[#ff3b30]">{item.incident_id}</span>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.freshness_status}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">{item.system_name}</span>
                          </div>
                          <h5 className="text-sm font-bold text-stone-900">{item.title}</h5>
                        </div>

                        <div className="px-3.5 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] font-mono font-bold text-xs shrink-0 text-right">
                          <span>{Math.round(item.similarity_score * 100)}% Match</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-[#efeae1] leading-relaxed font-medium">
                        {item.relevance_explanation}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {item.relevance_checklist.map((chk, i) => (
                          <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {chk}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#efeae1] flex items-center justify-between">
                        <div className="text-xs text-stone-600 max-w-lg truncate font-medium">
                          <span className="font-bold text-stone-900">Resolution: </span>
                          <span>{item.resolution}</span>
                        </div>

                        {item.source_metadata && item.source_metadata.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedSource({ incTitle: item.title, doc: item.source_metadata[0] })}
                            className="px-3 py-1 bg-white hover:bg-stone-100 text-stone-800 border border-[#efeae1] rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition-colors shrink-0 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#ff3b30]" />
                            <span>View Original Source</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="pt-4 border-t border-[#efeae1] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 bg-[#fcfaf7] hover:bg-stone-100 border border-[#efeae1] text-stone-800 rounded-full text-xs font-semibold"
              >
                Back to Edit Form
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#ff3b30]" />
                <span>Confirm & Publish Incident to Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Document Reader Drawer / Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#efeae1] p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900">{selectedSource.doc.file_name}</h4>
                  <p className="text-xs text-stone-500 font-medium">Post-Mortem Source Document for "{selectedSource.incTitle}"</p>
                </div>
              </div>
              <button onClick={() => setSelectedSource(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between text-xs text-stone-600 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] font-medium">
                <span>File Format: <strong className="text-[#ff3b30] uppercase">{selectedSource.doc.file_type}</strong></span>
                <span className="font-mono text-[11px] text-stone-500">{selectedSource.doc.storage_path}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Extracted Document Text Excerpt</label>
                <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] font-mono text-[11px] leading-relaxed text-stone-800 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {selectedSource.doc.extracted_text}
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
