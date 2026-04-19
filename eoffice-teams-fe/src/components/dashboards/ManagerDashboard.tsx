
import React from 'react';
import { Filter, Search, AlertCircle } from 'lucide-react';
import { User } from '../../models/user';
import { MOCK_TASKS } from '../../constants';

export const ManagerDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Quản lý Phòng Ban</h1>
          <p className="text-sm text-text-secondary mt-1">Phân công nhiệm vụ và theo dõi tiến độ xử lý văn bản của chuyên viên.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="teams-card p-6 border-l-4 border-teams-purple">
          <h3 className="text-[11px] font-bold text-text-secondary uppercase mb-4 tracking-wider">Tải trọng phòng ban</h3>
          <div className="flex items-center space-x-6">
             <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * 0.25} className="text-teams-purple" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">75%</div>
             </div>
             <div>
                <p className="text-2xl font-bold text-text-main">128</p>
                <p className="text-xs text-text-secondary">Task đang xử lý</p>
             </div>
          </div>
        </div>

        <div className="teams-card p-6">
          <h3 className="text-[11px] font-bold text-text-secondary uppercase mb-4 tracking-wider">Gợi ý phân công AI</h3>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-teams-border/50">
                <span className="text-xs font-semibold truncate max-w-30">Báo cáo Q1</span>
                <span className="text-[10px] text-teams-purple font-bold">Anh Tuấn</span>
             </div>
             <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-teams-border/50">
                <span className="text-xs font-semibold truncate max-w-30">Tờ trình nhân sự</span>
                <span className="text-[10px] text-teams-purple font-bold">Chị Lan</span>
             </div>
          </div>
        </div>

        <div className="teams-card p-6 bg-red-50/50 border-red-100">
           <div className="flex items-center space-x-2 text-accent-warning mb-4 font-bold">
              <AlertCircle size={16} />
              <span className="text-[11px] uppercase tracking-wider">Cảnh báo chậm trễ</span>
           </div>
           <p className="text-xs text-text-secondary font-medium">Có 3 văn bản đang nợ quá 24h chưa được chuyên viên tiếp nhận xử lý.</p>
           <button className="mt-4 w-full py-1.5 bg-accent-warning text-white rounded text-xs font-bold">Đôn đốc ngay</button>
        </div>
      </div>

      <div className="teams-card">
         <div className="p-4 border-b border-teams-border flex justify-between items-center">
            <h2 className="font-bold text-sm text-text-main">Danh sách việc phòng ban</h2>
            <div className="flex space-x-2">
               <button className="p-1.5 hover:bg-gray-100 rounded text-text-secondary"><Filter size={14} /></button>
               <button className="p-1.5 hover:bg-gray-100 rounded text-text-secondary"><Search size={14} /></button>
            </div>
         </div>
         <div className="data-grid-header">
            <div className="col-span-4 uppercase">Văn bản</div>
            <div className="col-span-2 text-center uppercase">Chuyên viên</div>
            <div className="col-span-2 text-center uppercase">Hạn định</div>
            <div className="col-span-2 text-center uppercase">Tiến độ</div>
            <div className="col-span-2 uppercase">Thao tác</div>
         </div>
         {MOCK_TASKS.map(task => (
           <div key={task.id} className="data-grid-row">
              <div className="col-span-4">
                 <p className="font-semibold text-text-main">{task.title}</p>
                 <p className="text-[10px] text-text-secondary">{task.id}</p>
              </div>
              <div className="col-span-2 text-center flex flex-col items-center">
                 <div className="w-5 h-5 bg-gray-200 rounded-full mb-1"></div>
                 <span className="text-[9px] font-medium text-text-secondary">Người xử lý</span>
              </div>
              <div className="col-span-2 text-center text-xs font-mono text-text-secondary">2024-03-25</div>
              <div className="col-span-2 flex items-center justify-center">
                 <div className="w-full max-w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teams-purple w-[45%]"></div>
                 </div>
              </div>
              <div className="col-span-2 flex justify-center">
                 <button className="text-[11px] font-bold text-teams-purple hover:underline">Phân công</button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};
