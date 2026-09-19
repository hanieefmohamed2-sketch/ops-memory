import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  ShieldAlert,
  Repeat,
  AlertTriangle,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'New Incident', path: '/incidents/new', icon: PlusCircle },
  { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
  { name: 'Recurring Problems', path: '/intelligence', icon: Repeat },
  { name: 'Knowledge Gaps', path: '/analytics', icon: AlertTriangle },
  { name: 'Analytics', path: '/management', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#111111] text-stone-200 flex flex-col h-screen sticky top-0 select-none z-30 shrink-0 shadow-2xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#222222] flex items-center space-x-3">
        {/* Halcyon Red Round Logo Icon */}
        <div className="w-8 h-8 rounded-full bg-[#ff3b30] flex items-center justify-center text-white shadow-md shadow-rose-950/30 shrink-0">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
            OPS MEMORY
          </h1>
          <p className="text-[10px] font-sans tracking-wide text-stone-400">
            Halcyon Studio Engine
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#222222] text-white shadow-sm font-bold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-[#1a1a1a]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#ff3b30]' : 'text-stone-400 group-hover:text-stone-200'
                  }`} />
                  <span className="tracking-tight">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Halcyon Badge Card */}
      <div className="p-4 border-t border-[#222222]">
        <div className="p-3.5 rounded-2xl bg-[#1a1a1a] border border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#ff3b30] text-white flex items-center justify-center text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
            </span>
            <span className="text-xs font-semibold text-stone-200">25+ Design Screens</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

