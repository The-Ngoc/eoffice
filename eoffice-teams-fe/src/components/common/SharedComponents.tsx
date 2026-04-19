
import React from 'react';
import { motion } from 'motion/react';
import { Bot, ArrowRight, Clock, CheckCircle, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { DocumentTask } from '../../types';

export function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      className={`teams-sidebar-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="icon-bg mb-1">{icon}</div>
      <span className="text-[10px] font-semibold text-center leading-tight px-1">{label}</span>
    </div>
  );
}

export function ToolCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="teams-card p-5 flex items-start space-x-3">
      <div className="p-2 bg-gray-50 text-teams-purple rounded">{icon}</div>
      <div>
        <h4 className="font-bold text-sm text-text-main">{title}</h4>
        <p className="text-xs text-text-secondary mt-1">{desc}</p>
      </div>
    </div>
  );
}

export function StatCard({ title, value, trend, color }: { title: string, value: string, trend?: string, color?: string }) {
  return (
    <div className="teams-card p-4">
      <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">{title}</div>
      <div className="flex items-baseline justify-between">
        <div className={`text-2xl font-bold ${color || 'text-teams-purple'}`}>{value}</div>
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: DocumentTask['status'] }) {
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teams-border text-text-secondary border border-transparent">
      {status === 'Urgent' ? 'Khẩn cấp' : status}
    </span>
  );
}

export function CopilotSuggestion({ text }: { text: string }) {
  return (
    <button className="w-full text-left p-3 rounded border border-teams-border bg-white hover:border-[#A18CD1] transition-all text-xs text-text-main flex items-center justify-between group">
      <span className="flex-1">{text}</span>
      <ArrowRight size={12} className="text-gray-300 group-hover:text-[#A18CD1]" />
    </button>
  );
}

export function HealthBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-700 font-bold">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
