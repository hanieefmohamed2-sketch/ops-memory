import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/knowledge?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="py-4 px-6 lg:px-10 flex items-center justify-between bg-[#fcfaf7] sticky top-0 z-20">
      <div className="flex items-center space-x-8">
        {/* Halcyon Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#ff3b30] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-stone-900 text-sm">
            OPS MEMORY
          </span>
        </Link>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-stone-600">
          <Link to="/" className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-colors">
            Overview
          </Link>
          <Link to="/knowledge" className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-colors">
            Knowledge Base
          </Link>
          <Link to="/incidents" className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-colors">
            Incidents
          </Link>
          <Link to="/analytics" className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-colors">
            Analytics
          </Link>
        </nav>
      </div>

      {/* Right Search & Action */}
      <div className="flex items-center space-x-3">
        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="relative hidden sm:flex items-center w-64 lg:w-80">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search solutions or keywords..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#efeae1] rounded-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#ff3b30] transition-all shadow-xs"
          />
        </form>

        {/* CTA Button */}
        <Link
          to="/incidents/new"
          className="px-5 py-2.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Incident</span>
        </Link>
      </div>
    </header>
  );
};
