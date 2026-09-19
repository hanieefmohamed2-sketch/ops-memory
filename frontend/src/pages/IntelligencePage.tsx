import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  BarChart3, 
  Bot, 
  User, 
  Send, 
  RefreshCw, 
  Server, 
  ArrowUpRight, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Plus
} from 'lucide-react';

interface ClusterItem {
  id: string;
  cluster_name: string;
  description: string;
  common_symptoms: string;
  occurrence_count: number;
  percentage_of_total: number;
  affected_systems: string[];
  historical_root_causes: string[];
  related_incident_ids: string[];
}

interface GapItem {
  id: string;
  problem_pattern: string;
  occurrences: number;
  documented_resolutions: number;
  coverage_status: 'uncovered' | 'partial' | 'resolved' | string;
  coverage_percentage: number;
  recommended_action: string;
}

interface AnalyticsSummary {
  total_incidents: number;
  total_clusters: number;
  total_gaps: number;
  uncovered_gaps_count: number;
  recurring_incidents_count: number;
  recurring_rate_percentage: number;
  knowledge_health_score: number;
  total_knowledge_records: number;
  verified_knowledge_records: number;
  top_affected_systems: { system_name: string; incident_count: number; percentage: number }[];
  severity_distribution: Record<string, number>;
}

export const IntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clusters' | 'gaps' | 'analytics' | 'assistant'>('clusters');

  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Assistant Chat State
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your OPS MEMORY Operational Continuity Assistant. I am connected to your vector-indexed post-mortems and incident database. Ask me about recurring clusters, knowledge gaps, or specific system runbooks.'
    }
  ]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resClusters, resGaps, resSummary] = await Promise.all([
        axios.get('http://localhost:8000/api/analytics/clusters'),
        axios.get('http://localhost:8000/api/analytics/gaps'),
        axios.get('http://localhost:8000/api/analytics/recurring')
      ]);

      setClusters(resClusters.data.data || []);
      setGaps(resGaps.data.data || []);
      setSummary(resSummary.data.data || null);
    } catch (err) {
      console.error("Failed to load intelligence data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendPrompt = async (promptText?: string) => {
    const q = promptText !== undefined ? promptText : input;
    if (!q.trim() || isSending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    if (promptText === undefined) setInput('');
    setIsSending(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chat', { query: q });
      const replyText = res.data.response || "No response received from AI engine.";
      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err: any) {
      console.error("AI Chat API Error:", err);
      const errDetail = err.response?.data?.detail || "Failed to reach AI Backend engine. Make sure the backend server is running.";
      setMessages((prev) => [...prev, { sender: 'ai', text: `⚠️ Error: ${errDetail}` }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Top Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Operational Intelligence & RAG Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Operational <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">intelligence.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Algorithmic detection of recurring incident clusters, unaddressed knowledge gaps, and real-time AI RAG synthesis.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#ff3b30]' : ''}`} />
          <span>Refresh Intelligence</span>
        </button>
      </div>

      {/* KPI Metrics Summary Bar (Halcyon Style) */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Incident Clusters</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{summary.total_clusters} Patterns</p>
            <p className="text-[11px] text-[#ff3b30] font-mono font-medium">Semantically grouped</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Knowledge Gaps</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{summary.uncovered_gaps_count} Uncovered</p>
            <p className="text-[11px] text-rose-600 font-mono font-medium">Action required</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Knowledge Health</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{summary.knowledge_health_score}%</p>
            <p className="text-[11px] text-stone-500 font-medium">Verified post-mortems</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Operational Memory</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{summary.total_incidents} Incidents</p>
            <p className="text-[11px] text-[#ff3b30] font-mono font-medium">{summary.verified_knowledge_records} verified records</p>
          </div>
        </div>
      )}

      {/* Navigation Pill Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#efeae1] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('clusters')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'clusters'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Incident Clusters ({clusters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gaps')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'gaps'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#ff3b30]" />
          <span>Knowledge Gaps ({gaps.filter(g => g.coverage_status === 'uncovered').length} Uncovered)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Recurring Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'assistant'
              ? 'bg-[#ff3b30] text-white shadow-md shadow-rose-950/20'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI RAG Assistant</span>
        </button>
      </div>

      {/* TAB 1: INCIDENT CLUSTERS */}
      {activeTab === 'clusters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Detected Operational Clusters ({clusters.length})</span>
            <span>Grouped by common symptoms & system tags</span>
          </div>

          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-[#efeae1] text-center space-y-3 shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#ff3b30] animate-spin mx-auto" />
              <p className="text-xs text-stone-500">Analyzing incident clusters...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clusters.map((cluster) => (
                <div 
                  key={cluster.id} 
                  className="bg-white p-6 rounded-3xl border border-[#efeae1] hover:border-[#ff3b30]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shrink-0 shadow-md">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">{cluster.cluster_name}</h3>
                          <p className="text-xs text-stone-500 mt-0.5">{cluster.description}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] font-mono font-bold text-xs shrink-0">
                        {cluster.occurrence_count} Incidents
                      </span>
                    </div>

                    {/* Affected Systems */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Affected Systems:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.affected_systems.map((sys, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full bg-[#fcfaf7] border border-[#efeae1] text-stone-700 font-mono font-medium">
                            {sys}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Common Symptoms */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Common Symptoms:</span>
                      <p className="text-xs text-stone-700 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] leading-relaxed font-sans">
                        {cluster.common_symptoms}
                      </p>
                    </div>

                    {/* Shared Historical Root Causes */}
                    <div className="space-y-1.5 pt-2 border-t border-[#f0eae0]">
                      <span className="text-[10px] font-semibold text-[#ff3b30] uppercase tracking-wider">Historical Root Causes:</span>
                      <ul className="space-y-1">
                        {cluster.historical_root_causes.map((rc, idx) => (
                          <li key={idx} className="text-xs text-stone-700 flex items-start space-x-1.5">
                            <span className="text-[#ff3b30] font-bold">•</span>
                            <span>{rc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Related Incident Badges */}
                  <div className="pt-3 border-t border-[#efeae1] flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono">IDs: {cluster.related_incident_ids.slice(0, 3).join(', ')}</span>
                    <button
                      onClick={() => navigate(`/knowledge?search=${encodeURIComponent(cluster.cluster_name)}`)}
                      className="px-4 py-2 bg-[#fcfaf7] hover:bg-stone-100 text-stone-900 border border-[#efeae1] rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <span>Inspect Post-Mortems</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#ff3b30]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KNOWLEDGE GAPS */}
      {activeTab === 'gaps' && (
        <div className="space-y-5">
          {/* Warning Banner */}
          <div className="bg-[#fff5f5] p-6 rounded-3xl border border-[#ffe0e0] flex items-start space-x-4 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Knowledge Continuity Warning</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                The organizational continuity engine detected recurring problem patterns with low or missing documented post-mortems. Resolving these gaps will protect against redundant outage investigation time.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>Identified Knowledge Gaps ({gaps.length})</span>
              <span>Ranked by occurrence count vs resolution ratio</span>
            </div>

            <div className="space-y-4">
              {gaps.map((gap) => (
                <div 
                  key={gap.id} 
                  className="bg-white p-6 rounded-3xl border border-[#efeae1] hover:border-[#ff3b30]/40 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      {gap.coverage_status === 'uncovered' ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]">
                          Uncovered Gap
                        </span>
                      ) : gap.coverage_status === 'partial' ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Partial Coverage
                        </span>
                      ) : (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Resolved
                        </span>
                      )}
                      <span className="text-xs font-mono text-stone-500 font-medium">
                        {gap.occurrences} Occurrences • {gap.documented_resolutions} Documented Fixes ({gap.coverage_percentage}% Coverage)
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900">{gap.problem_pattern}</h3>
                    <p className="text-xs text-stone-700 bg-[#fcfaf7] p-3 rounded-2xl border border-[#efeae1] font-medium leading-relaxed">
                      <strong className="text-[#ff3b30]">Recommended Action: </strong>{gap.recommended_action}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/incidents/new')}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Document Post-Mortem</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECURRING ANALYTICS */}
      {activeTab === 'analytics' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Affected Systems */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Top Recurring Systems</h3>
                <p className="text-xs text-stone-500">Most frequent operational incident domains</p>
              </div>
            </div>

            <div className="space-y-4">
              {summary.top_affected_systems.map((sys, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-stone-800">{sys.system_name}</span>
                    <span className="font-mono text-[#ff3b30]">{sys.incident_count} Incidents ({sys.percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#fcfaf7] h-2.5 rounded-full overflow-hidden border border-[#efeae1]">
                    <div 
                      className="bg-[#ff3b30] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(sys.percentage * 3, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Incident Severity Breakdown</h3>
                <p className="text-xs text-stone-500 font-medium">Historical classification across systems</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(summary.severity_distribution).map(([sev, count]) => (
                <div key={sev} className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-1 text-center">
                  <p className="text-xs font-semibold text-stone-500">{sev} Severity</p>
                  <p className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI RAG ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="h-[calc(100vh-16rem)] flex flex-col space-y-4">
          <div className="flex-1 bg-white rounded-3xl border border-[#efeae1] shadow-xs flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#efeae1] bg-[#fcfaf7] flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Operational RAG Assistant</h3>
                <p className="text-[11px] text-stone-500 font-medium">Vector similarity search across post-mortems</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${
                    msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#ff3b30] text-white'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-[#111111] text-white rounded-tr-none'
                        : 'bg-[#fcfaf7] border border-[#efeae1] text-stone-800 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-center space-x-3 text-xs text-stone-500 font-medium">
                  <div className="w-8 h-8 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="bg-[#fcfaf7] border border-[#efeae1] p-3 rounded-2xl text-stone-600 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff3b30]" />
                    <span>Searching vector knowledge base & synthesizing AI response...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }} className="p-4 bg-[#fcfaf7] border-t border-[#efeae1] flex items-center space-x-3">
              <input
                type="text"
                value={input}
                disabled={isSending}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI about operational runbooks, root causes, or incident resolution..."
                className="flex-1 bg-white border border-[#efeae1] rounded-full px-5 py-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] disabled:opacity-50 font-medium"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <span>{isSending ? 'Thinking...' : 'Send Prompt'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
