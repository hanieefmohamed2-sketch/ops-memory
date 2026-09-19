import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  Compass,
  Zap,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 max-w-[1350px] mx-auto pb-16">
      
      {/* 1. HERO BANNER (Halcyon Signature Style) */}
      <section className="bg-white rounded-3xl p-8 md:p-14 border border-[#efeae1] shadow-xs relative overflow-hidden text-center flex flex-col items-center space-y-6">
        
        {/* Top Status Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#fff5f5] border border-[#ffe0e0] text-[#ff3b30] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
          <span>Accepting operational incidents for 2026</span>
        </div>

        {/* Display Title with Red Italic Accent */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 max-w-4xl leading-[1.1]">
          A digital platform for{' '}
          <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">considered</span>{' '}
          products.
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-stone-500 max-w-2xl leading-relaxed font-medium">
          We partner with ambitious teams to design and build software, brand systems, and interactive operational continuity tools that feel inevitable.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/incidents/new')}
            className="px-7 py-3.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-2 transition-all"
          >
            <span>Log New Incident</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/knowledge')}
            className="px-7 py-3.5 bg-white border border-[#dddddd] hover:bg-stone-50 text-stone-800 rounded-full text-xs font-semibold transition-all shadow-2xs"
          >
            Explore Knowledge Base
          </button>
        </div>

        {/* Stat Cards Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-[#f4efe6] mt-4">
          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#f0eae0] text-center space-y-1">
            <p className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">48</p>
            <p className="text-[11px] text-stone-500 font-medium">Incidents Logged</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#f0eae0] text-center space-y-1">
            <p className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">$4.2B</p>
            <p className="text-[11px] text-stone-500 font-medium">System Value Saved</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#f0eae0] text-center space-y-1">
            <p className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">12</p>
            <p className="text-[11px] text-stone-500 font-medium">Minutes Avg MTTR</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fcfaf7] border border-[#f0eae0] text-center space-y-1">
            <p className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">99.8%</p>
            <p className="text-[11px] text-stone-500 font-medium">Continuity Health</p>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT HIGHLIGHT (6 Red Icon Feature Cards) */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-[#efeae1] shadow-xs space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
            Product Highlight
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            We present a fresh and clean design, with each screen connected to components that make customization easy.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">25+ Design Screen</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Designed with a professional look and ready to be customized to your needs.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Neatly & Organized Layer</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                For quick and easy customization, and smooth design updates.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Modern Clean Design</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                With a clean, professional, and polished design featuring a modern concept.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Fully Customizable</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                For easy modification of the design according to your brand preferences.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">40+ Components</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ready-to-use elements for quick and easy app development from scratch faster.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-4 hover:border-[#ff3b30]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shadow-rose-950/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900">Style Guide Included</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                For consistent branding and easy design customization across all screens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. A PROCESS BUILT FOR CLARITY (High-Contrast Black Card) */}
      <section className="bg-[#111111] text-white rounded-3xl p-8 md:p-14 shadow-xl space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#ff3b30] uppercase font-bold">
            HOW WE WORK
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            A process built for{' '}
            <span className="font-serif-accent text-[#ff3b30] font-normal lowercase">clarity.</span>
          </h2>
          <p className="text-xs md:text-sm text-stone-400 max-w-xl leading-relaxed">
            Four phases, each with a clear deliverable. No lock-in, no surprises, just steady, visible progress toward a product you are proud to ship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#222222]">
          <div className="space-y-3">
            <span className="text-[#ff3b30] font-mono text-xs font-bold">01 / DISCOVER</span>
            <h3 className="text-lg font-bold text-white">Discover</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              We understand the problem, the context, and the people behind it. We analyze past outages and system symptoms.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[#ff3b30] font-mono text-xs font-bold">02 / DEFINE</span>
            <h3 className="text-lg font-bold text-white">Define</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              We establish structured post-mortems, root cause definitions, and verified runbook remediation steps.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[#ff3b30] font-mono text-xs font-bold">03 / DELIVER</span>
            <h3 className="text-lg font-bold text-white">Deliver</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Real-time vector search delivers instant incident answers and root cause guidance to on-call engineers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RECENT INCIDENTS & ENGAGEMENTS */}
      <section className="bg-white rounded-3xl p-8 md:p-10 border border-[#efeae1] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#efeae1] pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Recent Engagements & Incidents
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Indexed post-mortem analyses and live investigation records
            </p>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 bg-[#fcfaf7] hover:bg-stone-100 border border-[#efeae1] text-stone-800 rounded-full text-xs font-semibold transition-all"
          >
            All Incidents →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { id: 'INC-2026-0148', title: 'Payment failures during checkout', system: 'Payment', severity: 'High', status: 'Investigating', date: 'Sep 18, 2026' },
            { id: 'INC-2026-0147', title: 'Login issue for admin users', system: 'Authentication', severity: 'Medium', status: 'Resolved', date: 'Sep 17, 2026' },
            { id: 'INC-2026-0146', title: 'Data sync delay in reporting', system: 'Analytics', severity: 'Medium', status: 'Resolved', date: 'Sep 17, 2026' },
          ].map((inc) => (
            <div key={inc.id} className="p-5 rounded-2xl bg-[#fcfaf7] border border-[#efeae1] space-y-3 hover:border-[#ff3b30]/40 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#ff3b30] font-bold">{inc.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#efeae1] text-stone-700">
                    {inc.system}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-900">{inc.title}</h3>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f0eae0] text-xs">
                <span className="text-stone-500 text-[11px] font-mono">{inc.date}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  inc.status === 'Investigating'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {inc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HAVE AN INCIDENT IN MIND? (Bottom Callout Card) */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-[#efeae1] shadow-xs text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
          Have an incident in mind?
        </h2>
        <p className="text-xs md:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          We are a team of operational experts ready to assist. Tell us what issue you are facing today.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/incidents/new')}
            className="px-7 py-3.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md inline-flex items-center space-x-2 transition-all"
          >
            <span>Start Inquiry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

    </div>
  );
};



