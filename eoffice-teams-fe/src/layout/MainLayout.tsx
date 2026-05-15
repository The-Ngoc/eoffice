
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bot, 
  Bell, 
  ArrowRight 
} from 'lucide-react';
import { SidebarItem, CopilotSuggestion } from '../components/common/SharedComponents';
import { Role, User } from '../models/user';
import { getAllUsers } from '../service/userService';


interface MainLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentRole: Role;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentUser, currentRole }) => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
  }, [users]);

  const handleSelectUser = (nextUserId: string) => {
    if (!nextUserId || nextUserId === currentUser.id) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('userId', nextUserId);
    window.location.assign(nextUrl.toString());
  };

  return (
    <div className="flex h-screen bg-teams-bg overflow-hidden font-sans">
      {/* MS Teams Left Rail */}
      <nav className="w-17 bg-teams-sidebar border-r border-teams-border flex flex-col items-center pt-3 shrink-0">
        <div className="flex-1 w-full space-y-4">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="H.Động" active />
          <SidebarItem icon={<FileText size={18} />} label="Tài liệu" />
          <SidebarItem icon={<Users size={18} />} label="Phòng" />
          <SidebarItem
            icon={<Users size={18} />}
            label="Đổi user"
            onClick={() => setIsUserListOpen(!isUserListOpen)}
            active={isUserListOpen}
          />

          {isUserListOpen && (
            <div className="mx-2 p-2 rounded-lg border border-teams-border bg-white/90 space-y-2">
              <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide px-1">
                Chọn người dùng
              </div>

              <select
                value={currentUser.id}
                onChange={(event) => handleSelectUser(event.target.value)}
                disabled={isLoadingUsers || sortedUsers.length === 0}
                className="w-full rounded border border-teams-border px-2 py-1.5 text-[11px] text-text-main bg-white outline-none focus:border-teams-purple"
                title="Chọn người dùng"
              >
                {isLoadingUsers && <option>Đang tải người dùng...</option>}
                {!isLoadingUsers && sortedUsers.length === 0 && <option>Không có dữ liệu user</option>}
                {!isLoadingUsers &&
                  sortedUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.role}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <SidebarItem icon={<Settings size={18} />} label="Cài đặt" />
        </div>

        <div className="pb-6 space-y-4">
          <SidebarItem 
            icon={<Bot size={18} />} 
            label="Copilot" 
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            active={isCopilotOpen}
          />
          <div className="w-8 h-8 bg-teams-purple rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:opacity-90">
            {currentUser.fullName.charAt(0)}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar / Search bar */}
        <header className="h-12 bg-white border-b border-teams-border flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center space-x-3">
             <span className="font-bold text-teams-purple text-sm">eOffice MS Teams</span>
             <div className="bg-[#E1DFDD] px-3 py-0.5 rounded text-[11px] font-bold text-text-secondary uppercase">
               {currentUser.role === 'ADMIN' ? 'ADMIN' : currentUser.role}
             </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-secondary">Chào, <strong>{currentUser.fullName}</strong></span>
        
            
            <button className="p-2 hover:bg-gray-100 rounded text-text-secondary relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRole}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* AI Copilot Side Panel */}
      <AnimatePresence>
        {isCopilotOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-teams-border bg-white flex flex-col relative z-10"
          >
            <div className="p-4 border-b border-teams-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[#A18CD1] font-bold">✦</span>
                <h2 className="font-semibold text-sm">Copilot AI Tổng hợp</h2>
              </div>
              <button onClick={() => setIsCopilotOpen(false)} className="text-gray-400 hover:text-gray-600">
                <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="copilot-suggestion">
                <p className="font-bold mb-1">Gợi ý ưu tiên:</p>
                <p className="text-sm text-text-secondary leading-normal">
                  Chào {currentUser.fullName}, có 3 văn bản khẩn cấp cần ký duyệt trong sáng nay. Tôi đã tóm tắt các điểm quan trọng trong Tờ trình dự án Chuyển đổi số.
                </p>
              </div>

              <div className="flex gap-2">
                 <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)' }}>Xem tóm tắt AI</button>
                 <button className="px-3 py-1.5 border border-teams-border rounded text-xs font-semibold text-text-main hover:bg-gray-50 transition-colors">Bỏ qua</button>
              </div>

              <div className="pt-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Bạn có muốn...?</h3>
                <div className="space-y-2">
                  <CopilotSuggestion text="Tóm tắt Nghị quyết hội đồng quản trị số 12" />
                  <CopilotSuggestion text="Phân tích KPI hiệu suất phòng ban" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-teams-border">
              <input 
                type="text" 
                placeholder="Hỏi AI..."
                className="w-full bg-white border border-teams-border rounded px-3 py-2 text-xs outline-none focus:border-teams-purple"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
