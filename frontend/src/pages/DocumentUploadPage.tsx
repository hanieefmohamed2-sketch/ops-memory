import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  ArrowUpRight, 
  AlertCircle,
  X
} from 'lucide-react';

interface ParsedResult {
  knowledge_record_id: string;
  incident_id: string;
  source_id: string;
  file_name: string;
  file_type: string;
  character_count: number;
  word_count: number;
  verification_status: string;
  structured_knowledge: {
    problem: string;
    context: string;
    symptoms: string;
    investigation_summary: string;
    failed_attempts: string;
    root_cause: string;
    resolution: string;
    outcome: string;
    lessons_learned: string;
  };
  extracted_text_excerpt: string;
}

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProcessingStep(1);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setTimeout(() => setProcessingStep(2), 500);
      setTimeout(() => setProcessingStep(3), 1200);
      setTimeout(() => setProcessingStep(4), 2000);

      const response = await axios.post('http://localhost:8000/api/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProcessingStep(5);
      setTimeout(() => {
        setResult(response.data.data);
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      console.error("Upload error:", err);
      const detailMsg = err.response?.data?.detail || "Failed to process document upload.";
      setError(detailMsg);
      setIsProcessing(false);
    }
  };

  const getStepStatusClass = (stepNum: number) => {
    if (processingStep > stepNum) return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
    if (processingStep === stepNum) return "bg-[#fff5f5] text-[#ff3b30] border-[#ffe0e0] font-bold animate-pulse";
    return "bg-[#fcfaf7] text-stone-400 border-[#efeae1]";
  };

  return (
    <div className="space-y-8 max-w-[1350px] mx-auto pb-16">
      
      {/* Header (Halcyon Style) */}
      <div className="bg-white rounded-3xl p-8 border border-[#efeae1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Automated AI Knowledge Ingestion Pipeline</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight pt-1">
            Document <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">ingestion.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 max-w-2xl font-medium">
            Upload operational post-mortems, incident logs, or architecture runbooks (PDF, DOCX, TXT, CSV). AI will extract structured knowledge records and generate vector embeddings.
          </p>
        </div>
      </div>

      {/* Main Upload Zone */}
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#efeae1] shadow-xs space-y-6">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-[#ff3b30] bg-[#fff5f5]' 
              : 'border-[#efeae1] hover:border-[#ff3b30]/50 bg-[#fcfaf7]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.csv,.log,.json,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-4 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center mx-auto shadow-md">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">
                {selectedFile ? selectedFile.name : "Drag & drop post-mortem document here, or click to browse"}
              </p>
              <p className="text-xs text-stone-500 mt-1 font-medium">
                Supports <strong className="text-stone-800">PDF, DOCX, TXT, CSV, LOG</strong> (up to 25MB)
              </p>
            </div>
            {selectedFile && (
              <span className="inline-block px-4 py-1 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] font-mono text-xs font-bold">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          {selectedFile ? (
            <button
              onClick={() => { setSelectedFile(null); setResult(null); setError(null); }}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center space-x-1 font-semibold"
            >
              <X className="w-4 h-4" />
              <span>Clear Selected File</span>
            </button>
          ) : <div />}

          <button
            disabled={!selectedFile || isProcessing}
            onClick={handleUpload}
            className="px-8 py-3.5 bg-[#111111] hover:bg-[#222222] disabled:opacity-50 text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#ff3b30]" />
                <span>Processing Document Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#ff3b30]" />
                <span>Start AI Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Progressive Processing Pipeline Indicator */}
        {isProcessing && (
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff3b30] animate-spin" />
                <span>Live Ingestion Pipeline Status</span>
              </span>
              <span className="font-mono text-[#ff3b30]">Step {processingStep} of 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
              <div className={`p-3 rounded-xl border ${getStepStatusClass(1)}`}>
                1. Uploading File
              </div>
              <div className={`p-3 rounded-xl border ${getStepStatusClass(2)}`}>
                2. Extracting Text
              </div>
              <div className={`p-3 rounded-xl border ${getStepStatusClass(3)}`}>
                3. AI Extraction
              </div>
              <div className={`p-3 rounded-xl border ${getStepStatusClass(4)}`}>
                4. Vector Embedding
              </div>
              <div className={`p-3 rounded-xl border ${getStepStatusClass(5)}`}>
                5. Complete
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#fff5f5] border border-[#ffe0e0] flex items-center space-x-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}
      </div>

      {/* Parsed Result Preview Card */}
      {result && (
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 bg-emerald-50/20 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-stone-900">Document Ingestion & AI Parsing Complete</h3>
                <p className="text-xs text-stone-500 font-medium">
                  File: <strong className="text-stone-900">{result.file_name}</strong> • Format: <span className="uppercase text-[#ff3b30] font-mono">{result.file_type}</span> • {result.word_count} words extracted ({result.character_count} chars)
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/knowledge/${result.knowledge_record_id}`)}
              className="px-6 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold flex items-center space-x-2 shadow-md"
            >
              <span>View Post-Mortem Record</span>
              <ArrowUpRight className="w-4 h-4 text-[#ff3b30]" />
            </button>
          </div>

          {/* Parsed Structure Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-[#efeae1] space-y-1 shadow-2xs">
              <span className="font-bold text-[#ff3b30] uppercase text-[10px] tracking-wider">Problem Statement</span>
              <p className="text-stone-800 leading-relaxed font-medium">{result.structured_knowledge.problem}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#efeae1] space-y-1 shadow-2xs">
              <span className="font-bold text-amber-600 uppercase text-[10px] tracking-wider">Root Cause Analysis</span>
              <p className="text-stone-800 leading-relaxed font-medium">{result.structured_knowledge.root_cause}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#efeae1] space-y-1 md:col-span-2 shadow-2xs">
              <span className="font-bold text-emerald-600 uppercase text-[10px] tracking-wider">Resolution & Fix</span>
              <p className="text-stone-800 leading-relaxed font-medium">{result.structured_knowledge.resolution}</p>
            </div>
          </div>

          {/* Extracted Text Excerpt Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Extracted Document Text Excerpt</label>
            <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] font-mono text-[11px] leading-relaxed text-stone-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {result.extracted_text_excerpt}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
