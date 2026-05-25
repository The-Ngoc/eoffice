
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bot, 
  Bell, 
  ArrowRight,
  Search,
  CheckCircle
} from 'lucide-react';
import { SidebarItem, CopilotSuggestion } from '../components/common/SharedComponents';
import { Role, User } from '../models/User.ts';
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
  const [userSearch, setUserSearch] = useState('');

  const roleLabels: Record<Role, string> = {
    ADMIN: 'Quản trị',
    LEADER: 'Lãnh đạo',
    MANAGER: 'Trưởng phòng',
    CLERICAL: 'Văn thư',
    SPECIALIST: 'Chuyên viên',
  };

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

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();

    if (!keyword) {
      return sortedUsers;
    }

    return sortedUsers.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword)
      );
    });
  }, [sortedUsers, userSearch]);

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

      <AnimatePresence>
        {isUserListOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng danh sách người dùng"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-transparent"
              onClick={() => setIsUserListOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="fixed left-20 top-28 z-40 w-80 overflow-hidden rounded-lg border border-teams-border bg-white shadow-2xl shadow-slate-900/15"
            >
              <div className="border-b border-teams-border bg-gray-50 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Đổi người dùng</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teams-purple text-sm font-black text-white">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-text-main">{currentUser.fullName}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase text-teams-purple">
                      {roleLabels[currentUser.role] ?? currentUser.role}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Tìm theo tên, email hoặc vai trò..."
                    className="h-9 w-full rounded-md border border-teams-border bg-white pl-9 pr-3 text-xs font-medium text-text-main outline-none transition-colors placeholder:text-gray-400 focus:border-teams-purple"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto px-2 pb-2 custom-scrollbar">
                {isLoadingUsers && (
                  <div className="px-3 py-6 text-center text-xs font-bold text-text-secondary">Đang tải người dùng...</div>
                )}
                {!isLoadingUsers && filteredUsers.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs font-bold text-text-secondary">Không tìm thấy người dùng</div>
                )}
                {!isLoadingUsers &&
                  filteredUsers.map((user) => {
                    const isCurrent = user.id === currentUser.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user.id)}
                        className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                          isCurrent ? 'bg-teams-purple/10 text-teams-purple' : 'text-text-main hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          isCurrent ? 'bg-teams-purple text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-black">{user.fullName}</div>
                          <div className="truncate text-[10px] font-medium text-text-secondary">{user.email || roleLabels[user.role]}</div>
                        </div>
                        <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-[9px] font-black uppercase text-gray-500">
                          {roleLabels[user.role] ?? user.role}
                        </span>
                        {isCurrent && <CheckCircle size={16} className="shrink-0 text-teams-purple" />}
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
