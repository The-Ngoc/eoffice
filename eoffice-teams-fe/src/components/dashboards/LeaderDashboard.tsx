
import React from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from '../../models/user';

import { MOCK_TASKS, TEAMS_PURPLE } from '../../constants';
import { StatCard } from '../common/SharedComponents';

export const LeaderDashboard: React.FC<{ user: User }> = ({ user }) => {
  const chartData = [
    { name: 'Thứ 2', val: 45 },
    { name: 'Thứ 3', val: 52 },
    { name: 'Thứ 4', val: 48 },
    { name: 'Thứ 5', val: 70 },
    { name: 'Thứ 6', val: 61 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Chào buổi sáng, <strong>{user.fullName}</strong></h1>
          <p className="text-sm text-text-secondary mt-1">Hệ thống AI đã tổng hợp 5 chỉ số KPI quan trọng cho ngày hôm nay.</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>Tạo chỉ đạo mới</span>
        </button>
      </header>

      <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Chờ phê duyệt" value="12" />
        <StatCard title="Công việc trễ hạn" value="02" color="text-accent-warning" />
        <StatCard title="Tỷ lệ hoàn thành" value="85%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 teams-card p-6">
          <div className="section-title text-base font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-teams-purple" />
            <span>Khối lượng văn bản tuần qua</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAMS_PURPLE} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={TEAMS_PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1DFDD" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#616161'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #EDEBE9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: TEAMS_PURPLE, fontWeight: '600', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="val" stroke={TEAMS_PURPLE} strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="teams-card p-6 flex flex-col">
          <div className="section-title text-base font-semibold mb-6">Hoạt động gần đây</div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {MOCK_TASKS.slice(0, 3).map(task => (
              <div key={task.id} className="text-sm">
                <p className="font-semibold text-text-main">{task.sender} đã trình ký</p>
                <p className="text-text-secondary mt-0.5">{task.title}</p>
                <span className="text-[11px] opacity-60">10 phút trước</span>
                <hr className="mt-4 border-teams-border" />
              </div>
            ))}
            
            <div className="bg-gray-100/50 p-3 rounded-lg border border-teams-border/50">
               <p className="font-semibold text-xs mb-2">Lịch họp Microsoft Teams</p>
               <div className="text-xs text-teams-purple font-medium">
                  14:00 - Họp giao ban tuần
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
