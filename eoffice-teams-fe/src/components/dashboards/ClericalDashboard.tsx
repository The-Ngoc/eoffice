
import React from 'react';
import { Filter } from 'lucide-react';

import { User } from '../../models/user';

import { MOCK_TASKS } from '../../constants';
import { StatusBadge } from '../common/SharedComponents';

export const ClericalDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Xử lý văn bản đến</h1>
          <p className="text-sm text-text-secondary mt-1">Hệ thống AI đã tự động bóc tách thông tin từ các tệp PDF vừa nhận.</p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <button className="px-3 py-1.5 border border-teams-border rounded text-xs font-semibold text-text-main hover:bg-gray-50 transition-colors">
            Tải tệp theo lô
          </button>
          <button className="btn-primary">
            Tiếp nhận hồ sơ mới
          </button>
        </div>
      </header>

      <div className="teams-card overflow-hidden">
        <div className="p-4 border-b border-teams-border bg-white flex justify-between items-center">
            <h2 className="font-bold text-sm text-text-main">Danh sách Backlog Phê duyệt</h2>
            <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
               <Filter size={14} />
            </button>
        </div>
        <div className="data-grid-header">
          <div className="col-span-1">STT</div>
          <div className="col-span-4 uppercase">Tên văn bản / Nhiệm vụ</div>
          <div className="col-span-2 text-center uppercase">Loại hình</div>
          <div className="col-span-2 text-center uppercase">Độ tin cậy</div>
          <div className="col-span-2 text-center uppercase">Trạng thái</div>
          <div className="col-span-1 uppercase">Thao tác</div>
        </div>
        
        <div className="max-h-125 overflow-y-auto">
          {MOCK_TASKS.map((task, idx) => (
            <div key={task.id} className="data-grid-row">
              <div className="col-span-1 font-mono text-[11px] text-gray-400">{idx + 1}</div>
              <div className="col-span-4">
                <p className="font-semibold text-text-main truncate">{task.title}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">{task.sender}</p>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {task.type}
                </span>
              </div>
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-accent-success w-[95%]"></div>
                </div>
                <span className="text-[10px] font-bold text-accent-success">95%</span>
              </div>
              <div className="col-span-2 text-center">
                <StatusBadge status={task.status} />
              </div>
              <div className="col-span-1 flex justify-center">
                <button className="btn-primary">Xem & Ký</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
