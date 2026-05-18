
import React, { useEffect, useState } from 'react';
import {
  Settings,
  Users as UsersIcon,
  ShieldCheck,
  Activity,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  Clock,
  Calendar,
  Bot,
  GitBranch
} from 'lucide-react';
import { User, Role } from '../../models/user';
import {
  addUser as addUserApi,
  deleteUserById,
  getAllUsers,
  updateUserRole,
} from '../../service/userService';
import { useAdmin } from '../../context/adminContext';
import { AnimatePresence, motion } from 'motion/react';


type AdminTab = 'Overview' | 'Users' | 'RBAC' | 'Settings' | 'AuditLogs' | 'Workflow';


export const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {

  const [activeTab, setActiveTab] = useState<AdminTab>('Overview');
  const { rolesConfig, systemConfig, auditLogs, workflows, updateSystemConfig } = useAdmin();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (payload: User): Promise<User> => {
    const created = await addUserApi(payload);
    setAllUsers((current) => [created, ...current.filter((u) => u.id !== created.id)]);
    return created;
  };

  const handleUpdateUserRole = async (id: string, role: Role): Promise<void> => {
    const updated = await updateUserRole(id, role);
    setAllUsers((current) => current.map((u) => (u.id === id ? { ...u, role: updated.role } : u)));
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    await deleteUserById(id);
    setAllUsers((current) => current.filter((u) => u.id !== id));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      // case 'Overview': return <OverviewSection data={overviewData} users={users} />;
      case 'Users':
        return (
          <UserManagementSection
            users={allUsers}
            onAdd={handleAddUser}
            onUpdate={handleUpdateUserRole}
            onDelete={handleDeleteUser}
          />
        );
      case 'RBAC': return <RBACSection rolesConfig={rolesConfig} />;
      case 'Settings': return <SystemSettingsSection config={systemConfig} onUpdate={updateSystemConfig} />;
      case 'AuditLogs': return <AuditLogsSection logs={auditLogs} />;
      case 'Workflow': return <WorkflowSection workflows={workflows} />;
      default: return null;
    }
  };




  return (
    <div className="flex bg-white rounded-lg border border-teams-border h-[calc(100vh-120px)] overflow-hidden shadow-sm">
      {/* Sidebar chọn Tab */}
      <aside className="w-64 border-r border-teams-border bg-gray-50/50 p-4 space-y-1">
        <h2 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quản trị Hệ thống</h2>
        <TabButton active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} icon={<LayoutDashboard size={18} />} label="Tổng quan" />
        <TabButton active={activeTab === 'Users'} onClick={() => setActiveTab('Users')} icon={<UsersIcon size={18} />} label="Người dùng" />
        <TabButton active={activeTab === 'RBAC'} onClick={() => setActiveTab('RBAC')} icon={<ShieldCheck size={18} />} label="Phân quyền (RBAC)" />
        <TabButton active={activeTab === 'Workflow'} onClick={() => setActiveTab('Workflow')} icon={<GitBranch size={18} />} label="Quy trình phê duyệt" />
        <TabButton active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} icon={<Settings size={18} />} label="Cấu hình hệ thống" />
        <TabButton active={activeTab === 'AuditLogs'} onClick={() => setActiveTab('AuditLogs')} icon={<Activity size={18} />} label="Audit Logs" />
      </aside>

      {/* Nội dung Tab */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {renderTabContent()}
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${active
      ? 'bg-teams-purple text-white shadow-md shadow-teams-purple/20'
      : 'text-gray-600 hover:bg-gray-100'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- SECTIONS ---

// const OverviewSection = ({ data, users }: { data: any[], users: UserRecord[] }) => {
//   const onlineUsers = users.filter(u => u.teamsStatus === 'Available' || u.teamsStatus === 'Busy').length;

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <h3 className="text-xl font-bold text-text-main">Thống kê tổng quan</h3>
//         <div className="flex space-x-2">
//           <span className="flex items-center space-x-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
//             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//             <span>{onlineUsers} Nhân sự đang Online</span>
//           </span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <StatCard title="Tổng người dùng" value={users.length.toString()} trend="+4 tháng này" />
//         <StatCard title="Văn bản đã ký" value="1,280" trend="+12%" />
//         <StatCard title="Thời gian xử lý TB" value="4.5h" trend="-15%" color="text-blue-600" />
//       </div>

//       <div className="teams-card p-6">
//         <h4 className="font-bold text-sm text-text-secondary uppercase mb-6 tracking-wider">Tỷ lệ hoàn thành công việc hệ thống</h4>
//         <div className="h-75">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={data}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1DFDD" />
//               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#616161' }} />
//               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#616161' }} />
//               <Tooltip
//                 cursor={{ fill: 'transparent' }}
//                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
//               />
//               <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
//                 {data.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };


const Roles: Role[] = ['ADMIN', 'LEADER', 'SPECIALIST', 'CLERICAL', 'MANAGER'];


const UserManagementSection = ({
  users,
  onAdd,
  onUpdate,
  onDelete,
}: {
  users: User[];
  onAdd: (payload: User) => Promise<User>;
  onUpdate: (id: string, role: Role) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Teams Directory Search states
  const [teamsSearchEmail, setTeamsSearchEmail] = useState('');
  const [teamsResult, setTeamsResult] = useState<any | null>(null);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserRole, setNewUserRole] = useState<Role>('SPECIALIST');


  const handleTeamsSearch = () => {
    if (!teamsSearchEmail) return;
    setIsSearchingTeams(true);
    // Search from real users list via API
    setTimeout(() => {
      const found = users.find(u => (u.email || '').toLowerCase() === teamsSearchEmail.toLowerCase());
      setTeamsResult(found || 'NotFound');
      setIsSearchingTeams(false);
    }, 300);
  };

  const handleAddFromTeams = async () => {
    if (teamsResult && teamsResult !== 'NotFound') {
      const payload = {
        id: teamsResult.id,
        fullName: teamsResult.displayName,
        email: teamsResult.mail,
        role: newUserRole
      };

      try {
        await onAdd(payload);

        setTeamsResult(null);          // Đóng khung kết quả tìm kiếm
        setTeamsSearchEmail('');       // Xóa trắng input email
        setShowAddForm(false);         // Đóng form chọn Role
        setNewUserRole('SPECIALIST');  // Reset role về mặc định (nếu cần)


      } catch (error) {
        console.error("Lỗi: Không thể lưu người dùng vào hệ thống eOffice.");
      }
    }
  };

  const handleEdit = async (userId: string) => {
    const currentUser = users.find((u) => u.id === userId);
    if (!currentUser) {
      return;
    }

    const nextRoleRaw = window.prompt(
      `Nhập role mới cho ${currentUser.fullName} (${Roles.join(', ')})`,
      currentUser.role,
    );

    if (!nextRoleRaw) {
      return;
    }

    const nextRole = nextRoleRaw.trim().toUpperCase() as Role;
    if (!Roles.includes(nextRole)) {
      window.alert('Role không hợp lệ.');
      return;
    }

    try {
      await onUpdate(userId, nextRole);
    } catch (error) {
      console.error('Lỗi: Không thể cập nhật role người dùng.', error);
      window.alert('Không thể cập nhật role. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (userId: string) => {
    const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?');
    if (!isConfirmed) {
      return;
    }

    try {
      await onDelete(userId);
    } catch (error) {
      console.error('Lỗi: Không thể xóa người dùng.', error);
      window.alert('Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return (
      u.fullName.toLowerCase().includes(keyword)
      || u.email?.toLowerCase().includes(keyword)
      || u.role.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main">Quản lý người dùng</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary font-medium">Tìm & Thêm từ Teams:</span>
          <div className="flex border border-teams-border rounded-md overflow-hidden bg-white shadow-sm focus-within:ring-1 focus-within:ring-teams-purple">
            <input
              type="text"
              placeholder="Email Teams..."
              className="px-3 py-1.5 text-xs outline-none w-48"
              value={teamsSearchEmail}
              onChange={(e) => setTeamsSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTeamsSearch()}
            />
            <button
              onClick={handleTeamsSearch}
              disabled={isSearchingTeams}
              className="bg-teams-purple text-white px-3 py-1.5 text-xs font-bold hover:bg-teams-purple/90 disabled:bg-gray-400 transition-colors"
            >
              {isSearchingTeams ? '...' : 'Tìm'}
            </button>
          </div>
        </div>
      </div>


      <AnimatePresence>
        {teamsResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-teams-purple/5 border border-teams-purple/20 rounded-lg flex items-center justify-between">

            {teamsResult === 'NotFound' ? (
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle size={18} />
                <span className="text-sm font-bold">Không tìm thấy tài khoản "{teamsSearchEmail}" trên hệ thống Teams.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <img src={teamsResult.avatar} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                  <div>
                    <p className="font-bold text-sm text-text-main">{teamsResult.displayName}</p>
                    <p className="text-[11px] text-text-secondary">{teamsResult.mail} • {teamsResult.officeLocation}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {!showAddForm ? (
                    <button onClick={() => setShowAddForm(true)} className="btn-primary text-[11px] px-4 py-1.5" >
                      Tiếp theo
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2">
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as Role)}
                        className="text-[11px] p-1.5 border border-teams-border rounded bg-white outline-none focus:border-teams-purple"
                      >
                        {Roles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddFromTeams}
                        className="bg-green-600 text-white text-[11px] font-bold px-4 py-1.5 rounded hover:bg-green-700 transition-colors"
                      >
                        Thêm vào hệ thống
                      </button>
                      <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
                    </div>
                  )}
                  <button onClick={() => setTeamsResult(null)} className="text-gray-400 p-1 hover:text-text-main"><XCircle size={18} /></button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-4 items-center justify-between pt-2 border-t border-teams-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Lọc danh sách người dùng hiện tại..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-teams-border rounded-md text-sm outline-none focus:border-teams-purple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* <div className="flex space-x-2">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${filter === 'All' ? 'bg-teams-purple text-white border-teams-purple' : 'bg-white text-text-secondary border-teams-border'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('Active')}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${filter === 'Active' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-text-secondary border-teams-border'}`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => setFilter('Inactive')}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${filter === 'Inactive' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-text-secondary border-teams-border'}`}
          >
            Ngưng hoạt động
          </button>
        </div> */}
      </div>

      <div className="overflow-hidden border border-teams-border rounded-lg shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-teams-border">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Người dùng</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Vai trò / Phòng ban</th>
              {/* <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase text-center">Trạng thái</th> */}
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teams-border">

            {/* Hiển thị danh sách người dùng đã lọc */}

            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-teams-purple/10 text-teams-purple font-bold flex items-center justify-center rounded-full text-sm border border-teams-purple/20 shadow-sm transition-transform hover:scale-105">
                      {u.fullName.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-main flex items-center space-x-1.5">
                        <span>{u.fullName}</span>
                      </p>
                      <p className="text-[11px] text-text-secondary font-medium mt-0.5">{u.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                    <p className="font-bold text-xs text-teams-purple">{u.role}</p>
                    {/* <p className="text-[11px] text-text-secondary font-medium mt-0.5">{u.}</p> */}
                  </td>

                {/* <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${u.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {u.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td> */}

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-1">
                    <button   onClick={() => handleEdit(u.id)} className="p-2 text-gray-400 hover:text-teams-purple hover:bg-teams-purple/5 rounded transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button   onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeamsStatusIcon = ({ status }: { status?: string }) => {
  const colors: Record<string, string> = {
    Available: 'bg-green-500',
    Busy: 'bg-red-500',
    Away: 'bg-yellow-500',
    Offline: 'bg-gray-400',
  };
  return (
    <div className="relative inline-block">
      <div className={`w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-100 ${colors[status || 'Offline']}`}></div>
    </div>
  );
};

const RBACSection = ({ rolesConfig }: { rolesConfig: any[] }) => {
  const [selectedRole, setSelectedRole] = useState<string>(rolesConfig[0].role);
  const currentRoleConfig = rolesConfig.find(r => r.role === selectedRole);

  const permissions = [
    { id: '1', name: 'Xem báo cáo', desc: 'Có quyền xem Dashboard và báo cáo tổng hợp' },
    { id: '2', name: 'Phê duyệt văn bản', desc: 'Quyền ký duyệt văn bản điện tử' },
    { id: '3', name: 'Quản lý nhân sự', desc: 'Có quyền tạo/xóa tài khoản trong phòng ban' },
    { id: '4', name: 'Quản trị hệ thống', desc: 'Toàn quyền cấu hình tham số hệ thống' },
    { id: '5', name: 'AI Copilot Advanced', desc: 'Sử dụng các tính năng AI cấp cao' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main">Phân quyền vai trò (RBAC)</h3>
        <button className="btn-primary flex items-center space-x-2">
          <ShieldCheck size={18} />
          <span>Lưu cấu hình quyền</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Danh sách vai trò</p>
          {rolesConfig.map(rc => (
            <button
              key={rc.role}
              onClick={() => setSelectedRole(rc.role)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all border ${selectedRole === rc.role
                ? 'bg-teams-purple text-white border-teams-purple shadow-md'
                : 'bg-white text-text-main border-teams-border hover:bg-gray-50'
                }`}
            >
              {rc.role}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 teams-card p-6">
          <div className="flex items-center space-x-2 mb-6">
            <h4 className="font-bold text-lg text-text-main">Cấu hình quyền cho: {selectedRole}</h4>
          </div>

          <div className="space-y-4">
            {permissions.map(p => (
              <label key={p.id} className="flex items-start space-x-4 p-4 rounded-lg border border-teams-border hover:border-teams-purple/30 hover:bg-teams-purple/5 transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded text-teams-purple focus:ring-teams-purple"
                  checked={currentRoleConfig?.permissions.includes(p.id)}
                  onChange={() => { }}
                />
                <div>
                  <p className="text-sm font-bold text-text-main group-hover:text-teams-purple transition-colors">{p.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemSettingsSection = ({ config, onUpdate }: { config: any, onUpdate: any }) => {
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-text-main">Cấu hình hệ thống</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="teams-card p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-teams-border pb-4">
            <Clock className="text-teams-purple" size={20} />
            <h4 className="font-bold text-text-main">Thời gian & Ngày làm việc</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">Giờ bắt đầu</label>
              <input type="time" className="w-full p-2 border border-teams-border rounded outline-none focus:border-teams-purple" value={config.workingHours.start} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">Giờ kết thúc</label>
              <input type="time" className="w-full p-2 border border-teams-border rounded outline-none focus:border-teams-purple" value={config.workingHours.end} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-text-secondary">Ngày nghỉ lễ trong năm</label>
            <div className="flex flex-wrap gap-2">
              {config.holidays.map((h: string) => (
                <span key={h} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-text-secondary">
                  <Calendar size={12} />
                  <span>{h}</span>
                  <button className="ml-1 hover:text-red-500"><XCircle size={10} /></button>
                </span>
              ))}
              <button className="px-2 py-1 border border-dashed border-teams-border rounded text-[10px] font-bold text-teams-purple hover:bg-teams-purple/5">+ Thêm ngày mới</button>
            </div>
          </div>
        </div>

        <div className="teams-card p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-teams-border pb-4">
            <Bot className="text-teams-purple" size={20} />
            <h4 className="font-bold text-text-main">Cấu hình AI Copilot</h4>
          </div>

          <div className="flex items-center justify-between p-4 bg-teams-purple/5 rounded-lg border border-teams-purple/10">
            <div>
              <p className="text-sm font-bold text-text-main">Bật AI Assistant</p>
              <p className="text-[11px] text-text-secondary">Cho phép gợi ý công việc và tóm tắt văn bản</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.aiCopilotEnabled} onChange={() => { }} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teams-purple"></div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary">Tần suất thông báo Copilot</label>
            <select className="w-full p-2 border border-teams-border rounded outline-none focus:border-teams-purple bg-white text-sm" value={config.notificationFrequency}>
              <option value="High">Cao (Liên tục gợi ý)</option>
              <option value="Medium">Trung bình</option>
              <option value="Low">Thấp (Chỉ khi có việc khẩn)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary px-8 py-2.5 shadow-lg shadow-teams-purple/20 transition-all hover:scale-105">Lưu tất cả thay đổi</button>
      </div>
    </div>
  );
};

const AuditLogsSection = ({ logs }: { logs: any[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main">Nhật ký hệ thống (Audit Logs)</h3>
        <button className="text-xs font-bold text-teams-purple hover:underline">Xuất báo cáo Excel</button>
      </div>

      <div className="teams-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-teams-border">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Thời gian</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Người thực hiện</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Hành động</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase">Đối tượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teams-border">
            {logs.map(log => (
              <tr key={log.id} className="text-sm">
                <td className="px-6 py-4 font-mono text-gray-400 text-xs">{log.timestamp}</td>
                <td className="px-6 py-4 font-bold text-text-main">{log.user}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase ring-1 ring-blue-100">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-text-secondary">{log.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WorkflowSection = ({ workflows }: { workflows: any[] }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main">Thiết lập quy trình phê duyệt (Workflow)</h3>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Thêm quy trình mới</span>
        </button>
      </div>

      <div className="teams-card p-10 bg-gray-50/50">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {workflows.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-white border-2 border-teams-purple rounded-full flex items-center justify-center shadow-md relative group">
                  <span className="text-teams-purple font-bold text-xs">{idx + 1}</span>
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full ring-2 ring-white">
                    <CheckCircle size={12} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-text-main">{step.name}</p>
                  <p className="text-[10px] text-teams-purple font-semibold uppercase">{step.approverRole}</p>
                </div>
              </div>
              {idx < workflows.length - 1 && (
                <div className="w-12 h-0.5 bg-teams-purple/30 rounded-full relative">
                  <div className="absolute top-1/2 left-full -translate-y-1/2 -translate-x-1/2 w-2 h-2 border-t-2 border-r-2 border-teams-purple/30 rotate-45"></div>
                </div>
              )}
            </React.Fragment>
          ))}

          <button className="w-16 h-16 border-2 border-dashed border-teams-border rounded-full flex items-center justify-center text-gray-400 hover:border-teams-purple hover:text-teams-purple transition-all group">
            <Plus size={24} className="group-hover:scale-125 transition-transform" />
          </button>
        </div>

        <div className="mt-12 p-6 bg-white border border-teams-border rounded-lg text-center shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Mô hình: <strong>Phê duyệt tuần tự</strong></p>
          <p className="text-xs text-gray-400 mt-1 italic">Văn bản sẽ được luân chuyển lần lượt qua các cấp được thiết lập ở trên.</p>
        </div>
      </div>
    </div>
  );
};
