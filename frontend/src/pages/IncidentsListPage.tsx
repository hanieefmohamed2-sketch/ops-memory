import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, ArrowUpDown, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockIncidents = [
  { id: 'INC-2026-089', title: 'PostgreSQL Vector Extension Connection Pool Exhaustion', severity: 'High', service: 'Database Cluster', status: 'In Review', author: 'Alex Chen', date: 'Sep 18, 2026' },
  { id: 'INC-2026-088', title: 'Redis Cache Eviction Surge during Peak Traffic', severity: 'Medium', service: 'Caching Layer', status: 'Resolved', author: 'Sarah Jenkins', date: 'Sep 17, 2026' },
  { id: 'INC-2026-087', title: 'Ingress Controller SSL Certificate Renewal Delay', severity: 'Low', service: 'Networking / Ingress', status: 'Resolved', author: 'DevOps Automated', date: 'Sep 15, 2026' },
  { id: 'INC-2026-086', title: 'Kafka Message Ingestion Backpressure Spike', severity: 'Critical', service: 'Event Stream', status: 'Resolved', author: 'Marcus Vance', date: 'Sep 12, 2026' },
  { id: 'INC-2026-085', title: 'Kubernetes Pod OOM Memory Limit Exceeded', severity: 'High', service: 'Worker Cluster', status: 'Resolved', author: 'Elena Rostova', date: 'Sep 10, 2026' },
];

export const IncidentsListPage: React.FC = () => {
  const [filter, setFilter] = useState('');

  const filteredIncidents = mockIncidents.filter(i => 
    i.title.toLowerCase().includes(filter.toLowerCase()) || 
    i.service.toLowerCase().includes(filter.toLowerCase()) ||
    i.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Page Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Operational Outage & Resolution Archive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Incidents <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">archive.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Historical operational incident logs, post-mortems, and resolution timelines.
          </p>
        </div>

        <Link
          to="/incidents/new"
          className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Incident</span>
        </Link>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-[#efeae1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Filter incidents by title, ID, or service..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#fcfaf7] border border-[#efeae1] rounded-full pl-11 pr-4 py-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] font-medium"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button className="px-4 py-2.5 bg-[#fcfaf7] border border-[#efeae1] rounded-full text-xs text-stone-700 font-semibold flex items-center space-x-2 hover:bg-stone-100 transition-colors shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>All Severities</span>
          </button>
          <button className="px-4 py-2.5 bg-[#fcfaf7] border border-[#efeae1] rounded-full text-xs text-stone-700 font-semibold flex items-center space-x-2 hover:bg-stone-100 transition-colors shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <span>Newest First</span>
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-3xl border border-[#efeae1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#efeae1] bg-[#fcfaf7] text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="p-5">ID</th>
                <th className="p-5">Incident Title</th>
                <th className="p-5">Service</th>
                <th className="p-5">Severity</th>
                <th className="p-5">Status</th>
                <th className="p-5">Logged By</th>
                <th className="p-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efeae1] text-xs">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[#fcfaf7]/80 transition-colors group cursor-pointer">
                  <td className="p-5 font-mono font-bold text-[#ff3b30]">
                    <Link to={`/incidents/${inc.id}`} className="hover:underline flex items-center gap-1">
                      {inc.id}
                    </Link>
                  </td>
                  <td className="p-5 font-bold text-stone-900 group-hover:text-[#ff3b30] transition-colors">
                    <Link to={`/incidents/${inc.id}`}>
                      {inc.title}
                    </Link>
                  </td>
                  <td className="p-5 text-stone-600 font-medium">{inc.service}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      inc.severity === 'Critical' ? 'bg-[#fff5f5] text-[#ff3b30] border border-[#ffe0e0]' :
                      inc.severity === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      inc.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      inc.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-5 text-stone-700 font-medium">{inc.author}</td>
                  <td className="p-5 text-right text-stone-500 font-medium">
                    <Link to={`/incidents/${inc.id}`} className="inline-flex items-center justify-end space-x-1.5 hover:text-[#ff3b30]">
                      <span className="font-mono text-[11px]">{inc.date}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#ff3b30]" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
