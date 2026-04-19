
import React from 'react';
import { FileText, Bot, CheckCircle, Plus } from 'lucide-react';
import { User } from '../../models/user';
import { ToolCard } from '../common/SharedComponents';

export const SpecialistDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 text-center py-20">
      <div className="w-16 h-16 bg-teams-purple/10 text-teams-purple rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText size={32} />
      </div>
      <h1 className="text-2xl font-bold text-text-main tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Không gian xử lý của Chuyên viên</h1>
      <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
        Hệ thống đang được cấu hình cho tab Chuyên viên. Tại đây bạn có thể soạn thảo, 
        dịch công văn và sử dụng AI để kiểm tra lỗi chính tả trong bản nháp.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
        <ToolCard icon={<Bot size={18} />} title="Dịch thuật AI" desc="Dịch công văn Việt - Anh tức thì." />
        <ToolCard icon={<CheckCircle size={18} />} title="Soát lỗi văn phong" desc="AI kiểm tra logic và ngữ pháp." />
        <ToolCard icon={<Plus size={18} />} title="Soạn thảo thông minh" desc="Gợi ý nội dung theo mẫu có sẵn." />
      </div>
    </div>
  );
};
