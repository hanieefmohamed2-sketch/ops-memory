import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building,
  Server,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface SourceMeta {
  id: string;
  file_name: string;
  file_type: string;
  storage_path?: string;
  extracted_text: string;
}

interface KnowledgeRecordItem {
  id: string;
  incident_id: string;
  incident_title: string;
  incident_severity: string;
  incident_status: string;
  system_name: string;
  department_name: string;
  problem: string;
  context?: string;
  symptoms?: string;
  root_cause: string;
  resolution: string;
  failed_attempts?: string;
  lessons_learned?: string;
  verification_status: 'verified' | 'needs_review' | 'outdated' | string;
  version_tag: string;
  created_at: string;
  updated_at: string;
  sources: SourceMeta[];
  sources_count: number;
}

interface VectorSearchResultItem {
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
  lessons_learned: string;
  relevance_explanation: string;
  relevance_checklist: string[];
  source_metadata: SourceMeta[];
  created_at: string;
}

export const KnowledgeExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlQuery = searchParams.get('search') || searchParams.get('query') || '';

  // Mode: 'explorer' vs 'vector'
  const [mode, setMode] = useState<'explorer' | 'vector'>(urlQuery ? 'vector' : 'explorer');

  // Explorer State
  const [search, setSearch] = useState(urlQuery);
  const [verificationStatus, setVerificationStatus] = useState<string>('all');
  const [department, setDepartment] = useState<string>('all');
  const [system, setSystem] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  
  const [records, setRecords] = useState<KnowledgeRecordItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 9;
  const [isLoading, setIsLoading] = useState(false);

  // Vector Search State
  const [vectorQuery, setVectorQuery] = useState(urlQuery || 'PostgreSQL connection pool max_connections timeout');
  const [vectorResults, setVectorResults] = useState<VectorSearchResultItem[]>([]);
  const [isVectorSearching, setIsVectorSearching] = useState(false);

  // Modal State
  const [selectedSource, setSelectedSource] = useState<{ title: string; doc: SourceMeta } | null>(null);

  // Fetch structured knowledge records
  const fetchKnowledgeRecords = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        limit,
        offset: (page - 1) * limit
      };
      if (search.trim()) params.search = search.trim();
      if (verificationStatus !== 'all') params.verification_status = verificationStatus;
      if (department !== 'all') params.department_id = department;
      if (system !== 'all') params.system_id = system;
      if (severity !== 'all') params.severity = severity;

      const response = await axios.get('http://localhost:8000/api/knowledge', { params });
      setRecords(response.data.data || []);
      setTotalRecords(response.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch knowledge records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run vector search
  const handleVectorSearch = async (queryToUse?: string) => {
    const q = queryToUse !== undefined ? queryToUse : vectorQuery;
    if (!q.trim()) return;

    setIsVectorSearching(true);
    try {
      const response = await axios.post('http://localhost:8000/api/search/similar', {
        query: q,
        limit: 6
      });
      setVectorResults(response.data.results || []);
    } catch (err) {
      console.error("Vector search failed:", err);
    } finally {
      setIsVectorSearching(false);
    }
  };

  useEffect(() => {
    if (urlQuery) {
      setVectorQuery(urlQuery);
      setSearch(urlQuery);
      setMode('vector');
      handleVectorSearch(urlQuery);
    } else if (mode === 'explorer') {
      fetchKnowledgeRecords();
    } else if (mode === 'vector' && vectorResults.length === 0) {
      handleVectorSearch();
    }
  }, [searchParams, mode, page, verificationStatus, department, system, severity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'explorer') {
      setPage(1);
      fetchKnowledgeRecords();
    } else {
      handleVectorSearch();
    }
  };

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const renderVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Verified Post-Mortem</span>
          </span>
        );
      case 'outdated':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Outdated</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Explorer & Vector Search</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Knowledge <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">explorer.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Browse, filter, and inspect verified operational post-mortems, root causes, and failed solution history.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1.5 bg-[#fcfaf7] border border-[#efeae1] rounded-full shrink-0">
          <button
            onClick={() => setMode('explorer')}
            className={`px-5 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all ${
              mode === 'explorer' 
                ? 'bg-[#111111] text-white shadow-md' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Faceted Explorer</span>
          </button>
          <button
            onClick={() => setMode('vector')}
            className={`px-5 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all ${
              mode === 'vector' 
                ? 'bg-[#ff3b30] text-white shadow-md shadow-rose-950/20' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semantic RAG Engine</span>
          </button>
        </div>
      </div>

      {/* Explorer Mode Layout */}
      {mode === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs space-y-5">
              <div className="flex items-center space-x-2 text-xs font-bold text-stone-900 uppercase tracking-wider pb-3 border-b border-[#efeae1]">
                <Filter className="w-4 h-4 text-[#ff3b30]" />
                <span>Filter Categories</span>
              </div>

              {/* Verification Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => { setVerificationStatus(e.target.value); setPage(1); }}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified Only</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="outdated">Outdated</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700">Department Domain</label>
                <select
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
                >
                  <option value="all">All Departments</option>
                  <option value="Payments & Billing">Payments & Billing</option>
                  <option value="Identity & Auth">Identity & Auth</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Core Infrastructure">Core Infrastructure</option>
                  <option value="Security & Compliance">Security & Compliance</option>
                </select>
              </div>

              {/* System */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700">Target System</label>
                <select
                  value={system}
                  onChange={(e) => { setSystem(e.target.value); setPage(1); }}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
                >
                  <option value="all">All Systems</option>
                  <option value="Payment Gateway">Payment Gateway</option>
                  <option value="User Authentication">User Authentication</option>
                  <option value="Search Index">Search Index</option>
                  <option value="API Gateway">API Gateway</option>
                  <option value="Notification Service">Notification Service</option>
                  <option value="Database Cluster">Database Cluster</option>
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700">Incident Severity</label>
                <select
                  value={severity}
                  onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                  className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full px-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-[#ff3b30] font-medium"
                >
                  <option value="all">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearch('');
                  setVerificationStatus('all');
                  setDepartment('all');
                  setSystem('all');
                  setSeverity('all');
                  setPage(1);
                }}
                className="w-full py-2.5 bg-[#fcfaf7] hover:bg-stone-100 border border-[#efeae1] rounded-full text-xs font-semibold text-stone-700 transition-colors shadow-2xs"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Main Knowledge Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by keywords, problem, root cause, symptoms, or resolution..."
                className="w-full bg-white border border-[#efeae1] rounded-full pl-12 pr-32 py-3.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] shadow-xs font-medium"
              />
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-5 py-2 bg-[#111111] hover:bg-[#222222] text-white text-xs font-semibold rounded-full shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-2">
              <span>Showing <strong>{records.length}</strong> of <strong>{totalRecords}</strong> knowledge records</span>
              <span>Page {page} of {totalPages}</span>
            </div>

            {/* Cards Grid */}
            {isLoading ? (
              <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-3 shadow-xs">
                <RefreshCw className="w-8 h-8 text-[#ff3b30] animate-spin mx-auto" />
                <p className="text-xs text-stone-500 font-medium">Loading knowledge records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-3 shadow-xs">
                <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-900">No matching knowledge records found</p>
                <p className="text-xs text-stone-500">Try clearing your filters or adjusting your search keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map((kr) => (
                  <div 
                    key={kr.id} 
                    className="bg-white p-6 rounded-3xl border border-[#efeae1] hover:border-[#ff3b30]/40 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        {renderVerificationBadge(kr.verification_status)}
                        <span className="text-[10px] font-mono font-medium text-stone-400">{kr.version_tag}</span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#ff3b30] transition-colors line-clamp-2">
                          {kr.incident_title}
                        </h3>
                        <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-1 font-medium">
                          <span className="flex items-center gap-1"><Server className="w-3 h-3 text-[#ff3b30]" />{kr.system_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Building className="w-3 h-3 text-stone-400" />{kr.department_name}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] line-clamp-3 leading-relaxed font-medium">
                        <strong className="text-[#ff3b30]">Problem: </strong>{kr.problem}
                      </p>

                      <div className="text-[11px] text-stone-600 space-y-1">
                        <p className="line-clamp-2">
                          <strong className="text-stone-900 font-semibold">Root Cause: </strong>{kr.root_cause}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#efeae1] flex items-center justify-between">
                      {kr.sources_count > 0 ? (
                        <button
                          onClick={() => setSelectedSource({ title: kr.incident_title, doc: kr.sources[0] })}
                          className="text-[10px] text-[#ff3b30] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{kr.sources_count} Evidence Doc{kr.sources_count > 1 ? 's' : ''}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-medium">No source file</span>
                      )}

                      <button
                        onClick={() => navigate(`/knowledge/${kr.id}`)}
                        className="px-3.5 py-1.5 bg-[#fcfaf7] hover:bg-stone-100 text-stone-900 border border-[#efeae1] rounded-full text-xs font-semibold flex items-center space-x-1 transition-colors shadow-2xs"
                      >
                        <span>Post-Mortem</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#ff3b30]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#efeae1]">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-white border border-[#efeae1] disabled:opacity-50 text-stone-800 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs text-stone-500 font-medium">
                  Page <strong className="text-stone-900">{page}</strong> of <strong className="text-stone-900">{totalPages}</strong>
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-white border border-[#efeae1] disabled:opacity-50 text-stone-800 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vector RAG Mode Layout */}
      {mode === 'vector' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#ff3b30] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Semantic pgvector Natural Language Search</span>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={vectorQuery}
                onChange={(e) => setVectorQuery(e.target.value)}
                placeholder="Search operational knowledge base by natural language prompt or error message..."
                className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full pl-12 pr-36 py-3.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
              />
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
              
              <button
                type="submit"
                disabled={isVectorSearching}
                className="absolute right-2 top-2 px-5 py-2 bg-[#ff3b30] hover:bg-rose-600 text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
              >
                {isVectorSearching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search Vectors</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Try Prompt:</span>
              {[
                'PostgreSQL max_connections pool exhaustion',
                'Redis cache thundering herd eviction',
                'JWKS key rotation 401 unauthorized',
                'Kafka partition lag spike',
                'Kubernetes pod OOMKilled exit code 137'
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setVectorQuery(q); handleVectorSearch(q); }}
                  className="text-[10px] px-3 py-1 rounded-full bg-[#fcfaf7] border border-[#efeae1] text-stone-700 hover:text-[#ff3b30] hover:border-[#ff3b30]/40 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-medium text-stone-500">
              <span>Vector Search Results ({vectorResults.length} matches)</span>
              <span>Ranked by 1536-dim vector cosine similarity</span>
            </div>

            {vectorResults.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-2 shadow-xs">
                <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-900">No matching historical incident found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vectorResults.map((item) => (
                  <div key={item.incident_id} className="bg-white p-6 rounded-3xl border border-[#efeae1] hover:border-[#ff3b30]/40 transition-all shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-mono font-bold text-[#ff3b30]">{item.incident_id}</span>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.freshness_status}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">{item.system_name}</span>
                          </div>
                          <h3 className="text-base font-bold text-stone-900">{item.title}</h3>
                        </div>

                        <div className="px-3.5 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] font-mono font-bold text-xs shrink-0">
                          {Math.round(item.similarity_score * 100)}% Match
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] leading-relaxed font-medium">
                        {item.relevance_explanation}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {item.relevance_checklist.map((chk, i) => (
                          <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {chk}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#f0eae0] text-xs">
                        <div>
                          <span className="font-semibold text-stone-500">Root Cause: </span>
                          <span className="text-stone-800">{item.root_cause}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-stone-500">Resolution: </span>
                          <span className="text-stone-800">{item.resolution}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#efeae1] flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 font-medium">Domain: {item.department_name}</span>
                      <button
                        onClick={() => navigate(`/knowledge/${item.incident_id}`)}
                        className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                      >
                        <span>Full Post-Mortem</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                  <h4 className="text-base font-bold text-stone-900">{selectedSource.doc.file_name}</h4>
                  <p className="text-xs text-stone-500 font-medium">Post-Mortem Source Document for "{selectedSource.title}"</p>
                </div>
              </div>
              <button onClick={() => setSelectedSource(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between text-xs text-stone-600 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] font-medium">
                <span>File Format: <strong className="text-[#ff3b30] uppercase">{selectedSource.doc.file_type}</strong></span>
                <span className="font-mono text-[11px] text-stone-500">{selectedSource.doc.storage_path || 'evidence_attachment'}</span>
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
