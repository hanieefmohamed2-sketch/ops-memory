import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Zap, 
  RefreshCw, 
  Server, 
  CheckCircle2
} from 'lucide-react';

interface OperationalData {
  total_incidents: number;
  total_knowledge_records: number;
  verified_records: number;
  needs_review_records: number;
  outdated_records: number;
  coverage_percentage: number;
  trend_data: { date: string; incidents: number; resolved: number }[];
  department_data: { department_name: string; incidents: number; resolved: number }[];
  system_data: { system_name: string; count: number; resolved: number }[];
  severity_pie_data: { name: string; value: number; color: string }[];
  verification_pie_data: { name: string; value: number; color: string }[];
}

interface EvalMetrics {
  total_vector_embeddings: number;
  vector_dimension: number;
  top_1_accuracy: number;
  top_3_accuracy: number;
  top_5_accuracy: number;
  mrr_score: number;
  avg_retrieval_latency_ms: number;
  retrieval_time_reduction_percentage: number;
  similarity_distribution: { range: string; count: number }[];
}

interface ReviewQueueItem {
  id: string;
  incident_id: string;
  incident_title: string;
  incident_severity: string;
  system_name: string;
  current_system_version: string;
  recorded_version: string;
  has_version_mismatch: boolean;
  verification_status: string;
  days_since_update: number;
  review_reasons: string[];
  review_reason_primary: string;
  problem: string;
  root_cause: string;
  resolution: string;
}

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visualizations' | 'eval' | 'health'>('visualizations');
  const [opData, setOpData] = useState<OperationalData | null>(null);
  const [evalData, setEvalData] = useState<EvalMetrics | null>(null);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchAllAnalytics = async () => {
    setIsLoading(true);
    try {
      const [resOp, resEval, resQueue] = await Promise.all([
        axios.get('http://localhost:8000/api/analytics/operational'),
        axios.get('http://localhost:8000/api/analytics/eval-metrics'),
        axios.get('http://localhost:8000/api/knowledge/review-queue')
      ]);

      setOpData(resOp.data.data || null);
      setEvalData(resEval.data.data || null);
      setQueue(resQueue.data.data || []);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const handleVerifyRecord = async (item: ReviewQueueItem, newStatus: 'verified' | 'outdated') => {
    setVerifyingId(item.id);
    try {
      await axios.post(`http://localhost:8000/api/knowledge/${item.id}/verify`, {
        verification_status: newStatus,
        problem: item.problem,
        root_cause: item.root_cause,
        resolution: item.resolution
      });
      await fetchAllAnalytics();
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Operational Analytics & RAG Evaluation Metrics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Operational <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">analytics.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Real-time quantitative metrics tracking incident volume trends, department breakdowns, and RAG vector retrieval accuracy benchmarks.
          </p>
        </div>

        <button
          onClick={fetchAllAnalytics}
          disabled={isLoading}
          className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold flex items-center space-x-2 shrink-0 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#ff3b30]' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top KPI Cards Bar */}
      {opData && evalData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>30-Day Incident Volume</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{opData.total_incidents} Incidents</p>
            <p className="text-[11px] text-emerald-600 font-mono font-medium">+{evalData.retrieval_time_reduction_percentage}% Resolution Velocity</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Knowledge Base Coverage</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{opData.coverage_percentage}% Verified</p>
            <p className="text-[11px] text-stone-500 font-medium">{opData.verified_records} indexed post-mortems</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Top-1 RAG Accuracy</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{evalData.top_1_accuracy}%</p>
            <p className="text-[11px] text-[#ff3b30] font-mono font-medium">MRR Score: {evalData.mrr_score}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#efeae1] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Vector Search Latency</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff5f5] text-[#ff3b30] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-stone-900 tracking-tight">{evalData.avg_retrieval_latency_ms} ms</p>
            <p className="text-[11px] text-stone-500 font-medium">{evalData.total_vector_embeddings} 1536-dim vectors</p>
          </div>
        </div>
      )}

      {/* Navigation Pill Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#efeae1] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('visualizations')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'visualizations'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Operational Visualizations</span>
        </button>

        <button
          onClick={() => setActiveTab('eval')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'eval'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Zap className="w-4 h-4 text-[#ff3b30]" />
          <span>Vector Evaluation Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'health'
              ? 'bg-[#111111] text-white shadow-md'
              : 'bg-white border border-[#efeae1] text-stone-700 hover:bg-stone-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Review Queue ({queue.length})</span>
        </button>
      </div>

      {/* TAB 1: OPERATIONAL VISUALIZATIONS */}
      {activeTab === 'visualizations' && opData && (
        <div className="space-y-8">
          {/* 30-Day Trend Area Chart */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">30-Day Incident Volume Trends & Resolution Velocity</h3>
                <p className="text-xs text-stone-500 font-medium">Daily incident generation vs rapid resolution rates</p>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]">
                Live DB Aggregation
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opData.trend_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" />
                  <XAxis dataKey="date" stroke="#78716c" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#78716c" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="incidents" name="New Incidents" stroke="#ff3b30" fillOpacity={1} fill="url(#colorIncidents)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="resolved" name="Resolved Incidents" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department & System Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Breakdown */}
            <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <BuildingIcon />
                <span>Incident Distribution by Department</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opData.department_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" />
                    <XAxis dataKey="department_name" stroke="#78716c" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#78716c" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '11px' }} />
                    <Bar dataKey="incidents" name="Total Incidents" fill="#111111" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#ff3b30" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Breakdown */}
            <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-[#ff3b30]" />
                <span>Top Affected Systems Breakdown</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opData.system_data.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" />
                    <XAxis dataKey="system_name" stroke="#78716c" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#78716c" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '11px' }} />
                    <Bar dataKey="count" name="Incidents" fill="#ff3b30" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Severity & Verification Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900">Incident Severity Ratios</h3>
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={opData.severity_pie_data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4}>
                      {opData.severity_pie_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900">Knowledge Base Verification Status</h3>
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={opData.verification_pie_data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4}>
                      {opData.verification_pie_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VECTOR RETRIEVAL EVALUATION METRICS */}
      {activeTab === 'eval' && evalData && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#ff3b30]" />
                  <span>RAG Vector Retrieval Accuracy Benchmarks</span>
                </h3>
                <p className="text-xs text-stone-500 font-medium">Evaluated on 1536-dimensional L2-normalized pgvector embeddings</p>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0] text-xs font-mono font-bold">
                1536-dim Vector Memory
              </span>
            </div>

            {/* Accuracy Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2 text-center">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Top-1 Accuracy</p>
                <p className="text-3xl font-extrabold text-[#ff3b30] tracking-tight">{evalData.top_1_accuracy}%</p>
                <p className="text-[10px] text-stone-500 font-medium">First match is exact solution</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2 text-center">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Top-3 Accuracy</p>
                <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{evalData.top_3_accuracy}%</p>
                <p className="text-[10px] text-stone-500 font-medium">Solution in top 3 results</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2 text-center">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Top-5 Accuracy</p>
                <p className="text-3xl font-extrabold text-stone-900 tracking-tight">{evalData.top_5_accuracy}%</p>
                <p className="text-[10px] text-stone-500 font-medium">Solution in top 5 results</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-2 text-center">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">MRR Score</p>
                <p className="text-3xl font-extrabold text-amber-600 tracking-tight">{evalData.mrr_score}</p>
                <p className="text-[10px] text-stone-500 font-medium">Mean Reciprocal Rank</p>
              </div>
            </div>
          </div>

          {/* Cosine Similarity Distribution Bar Chart */}
          <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Cosine Similarity Score Range Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evalData.similarity_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" />
                  <XAxis dataKey="range" stroke="#78716c" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#78716c" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#efeae1', borderRadius: '16px', fontSize: '11px' }} />
                  <Bar dataKey="count" name="Vector Embeddings" fill="#ff3b30" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE HEALTH & REVIEW QUEUE */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Administrative Review Queue ({queue.length} items flagged)</span>
            <span>Flagged for version drift or aging</span>
          </div>

          <div className="space-y-4">
            {queue.slice(0, 10).map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-[#efeae1] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#ff3b30]">{item.incident_id}</span>
                    <span className="text-stone-900 font-bold">{item.system_name}</span>
                    {item.has_version_mismatch && (
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]">
                        Drift: {item.recorded_version} vs {item.current_system_version}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{item.incident_title}</h4>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={verifyingId === item.id}
                    onClick={() => handleVerifyRecord(item, 'verified')}
                    className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full font-semibold text-xs flex items-center space-x-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verify ({item.current_system_version})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BuildingIcon = () => (
  <svg className="w-4 h-4 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
