import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Database, Upload, CheckCircle2 } from 'lucide-react';

export const ManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Knowledge Management & System Configuration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Knowledge <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">management.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Manage database connections, vector embedding configurations, and external document ingestors.
          </p>
        </div>

        <button
          onClick={() => navigate('/documents')}
          className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 shrink-0 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF / DOCX</span>
        </button>
      </div>

      {/* Database & Vector Status Card */}
      <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#efeae1] pb-5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">PostgreSQL + pgvector Database</h2>
              <p className="text-xs text-stone-500 font-mono">postgresql://postgres:***@localhost:5432/ops_memory</p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Vector Extension Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] text-xs space-y-1">
            <span className="text-stone-500 font-medium">Vector Table</span>
            <p className="font-mono font-bold text-stone-900 text-sm">incident_embeddings</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] text-xs space-y-1">
            <span className="text-stone-500 font-medium">Embedding Dimensions</span>
            <p className="font-mono font-bold text-[#ff3b30] text-sm">1536 (OpenAI / Gemini)</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] text-xs space-y-1">
            <span className="text-stone-500 font-medium">Distance Metric</span>
            <p className="font-mono font-bold text-stone-900 text-sm">Cosine Distance (&lt;=&gt;)</p>
          </div>
        </div>
      </div>

      {/* Document Ingestion Sources */}
      <div className="bg-white p-8 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
          <h2 className="text-xl font-bold text-stone-900">Document & Post-Mortem Ingestors</h2>
          <button
            onClick={() => navigate('/documents')}
            className="px-5 py-2.5 bg-[#fcfaf7] hover:bg-stone-100 text-stone-800 border border-[#efeae1] rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>Document Ingestion Hub</span>
          </button>
        </div>

        <div className="space-y-4">
          {[
            { name: 'PyPDF Ingestor', type: 'PDF Parser', status: 'Enabled', docs: '342 Documents' },
            { name: 'Python-Docx Parser', type: 'Word Document Parser', status: 'Enabled', docs: '128 Documents' },
            { name: 'FastAPI Webhook Listener', type: 'REST Ingestion Endpoint', status: 'Active', docs: '1,012 Webhooks' },
          ].map((source) => (
            <div key={source.name} className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-stone-900">{source.name}</p>
                <p className="text-xs text-stone-500 font-medium">{source.type}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-mono font-semibold text-stone-600">{source.docs}</span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {source.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
