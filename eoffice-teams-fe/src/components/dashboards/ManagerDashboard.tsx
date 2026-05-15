
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Send, 
  Bot, 
  CheckCircle, 
  Zap, 
  MessageCircle,
  MoreVertical,
  X,
  AlertCircle,
  TrendingUp,
  Layout,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../models/user';
import { TaskModel, MemberModel, KPIStats } from '../../types';
import { managerService } from '../../service/ManagerService';
import { StatCard, StatusBadge } from '../common/SharedComponents';

export const ManagerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'Inbound' | 'Team'>('Inbound');
  const [inboundTasks, setInboundTasks] = useState<TaskModel[]>([]);
  const [teamTasks, setTeamTasks] = useState<TaskModel[]>([]);
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Task for Details
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);

  // Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<TaskModel>>({
    title: '',
    priority: 'Medium',
    status: 'Todo',
    deadline: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasks, subtasks, deptMembers, kpi] = await Promise.all([
        managerService.getAssignedTasks(),
        managerService.getSubTasks(),
        managerService.getDepartmentMembers(),
        managerService.getManagementStats()
      ]);
      setInboundTasks(tasks);
      setTeamTasks(subtasks);
      setMembers(deptMembers);
      setStats(kpi);
    } catch (err) {
      console.error('Failed to load manager dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateText?: string) => {
    if (!dateText) return '';

    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) {
      return dateText;
    }

    return parsed.toLocaleDateString('vi-VN');
  };

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.assigneeId) return;
    const success = await managerService.assignTaskToMember({
      ...newTask,
      sender: user.fullName,
      createdAt: new Date().toISOString(),
      parentId: selectedTask?.id // Assign subtask linked to selected leader task
    });
    if (success) {
      setShowAssignModal(false);
      setNewTask({ title: '', priority: 'Medium', status: 'Todo', deadline: '' });
      loadData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight leading-tight">
            Quản trị <span className="text-teams-purple italic">Phòng Ban</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium italic">
            "Sức mạnh của đội ngũ nằm ở từng cá nhân, và sức mạnh của cá nhân chính là đội ngũ."
          </p>
        </div>
        <div className="flex bg-white rounded-lg border border-teams-border p-1 shadow-sm">
           <button 
            onClick={() => setActiveTab('Inbound')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'Inbound' ? 'bg-teams-purple text-white shadow-md shadow-teams-purple/20' : 'text-text-secondary hover:bg-gray-100'}`}
           >
              <FileText size={14} />
              <span>Chỉ đạo từ Sếp</span>
           </button>
           <button 
            onClick={() => setActiveTab('Team')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'Team' ? 'bg-teams-purple text-white shadow-md shadow-teams-purple/20' : 'text-text-secondary hover:bg-gray-100'}`}
           >
              <Users size={14} />
              <span>Quản lý Đội ngũ</span>
           </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Nhiệm vụ cấp trên" value={inboundTasks.length.toString()} trend="2 việc hôm nay" />
        <StatCard title="Task đã phân công" value={teamTasks.length.toString()} trend="+4 tuần này" />
        <StatCard title="Hiệu suất xử lý" value={`${stats?.efficiency}%`} color="text-green-600" trend="+0.5%" />
        <StatCard title="Task trễ hạn" value="03" color="text-red-600" trend="Cần đôn đốc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-150">
        {/* Left Column: List */}
        <div className={`transition-all duration-500 ${selectedTask ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
          <div className="teams-card h-full flex flex-col">
            <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
               <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
                 {activeTab === 'Inbound' ? <Send size={16} className="text-teams-purple" /> : <Layout size={16} className="text-teams-purple" />}
                 {activeTab === 'Inbound' ? 'Danh sách chỉ đạo' : 'Tiến độ xử lý của Phòng'}
               </h2>
               <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm..."
                      className="pl-8 pr-4 py-1.5 bg-white border border-teams-border rounded-md text-[11px] outline-none focus:border-teams-purple w-40"
                    />
                  </div>
                  {activeTab === 'Team' && (
                    <button 
                      onClick={() => {
                        setSelectedTask(null);
                        setShowAssignModal(true);
                      }}
                      className="btn-primary p-1.5 rounded-md"
                    >
                      <Plus size={14} />
                    </button>
                  )}
               </div>
            </div>

            <div className="divide-y divide-teams-border overflow-y-auto max-h-150 custom-scrollbar">
               {isLoading ? (
                  <div className="p-12 text-center text-xs text-text-secondary">Đang tải danh sách...</div>
               ) : (
                  (activeTab === 'Inbound' ? inboundTasks : teamTasks).map(task => (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-4 hover:bg-teams-purple/5 cursor-pointer transition-all border-l-4 ${selectedTask?.id === task.id ? 'bg-teams-purple/5 border-l-teams-purple' : 'border-l-transparent'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            task.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
                            task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {task.priority === 'Critical' ? 'HỎA TỐC' : task.priority === 'High' ? 'KHẨN' : 'THƯỜNG'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Hạn: {formatDate(task.deadline)}</span>
                       </div>
                       <h3 className="text-sm font-bold text-text-main group-hover:text-teams-purple transition-colors">{task.title}</h3>
                       <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             {activeTab === 'Inbound' ? (
                                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tight">Giao bởi: {task.sender}</span>
                             ) : (
                                <div className="flex items-center space-x-1.5">
                                   <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                                   <span className="text-[10px] text-text-secondary font-medium italic">
                                     {members.find(m => m.id === task.assigneeId)?.name || 'Chưa gán'}
                                   </span>
                                </div>
                             )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === 'Completed' ? 'bg-green-50 text-green-600' :
                            task.status === 'Overdue' ? 'bg-red-50 text-red-600 animate-pulse' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {task.status}
                          </span>
                       </div>
                    </div>
                  ))
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Detail / Management */}
        <div className={`transition-all duration-500 overflow-hidden ${selectedTask ? 'lg:col-span-7' : 'lg:col-span-4'}`}>
           <AnimatePresence mode="wait">
              {selectedTask ? (
                <motion.div 
                  key="task-detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="teams-card flex flex-col h-full overflow-hidden"
                >
                   <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 bg-teams-purple/10 flex items-center justify-center rounded-lg shadow-sm border border-teams-purple/20">
                            <FileText size={18} className="text-teams-purple" />
                         </div>
                         <div>
                            <h2 className="font-bold text-xs text-text-main line-clamp-1">{selectedTask.title}</h2>
                            <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{selectedTask.id}</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-text-main p-1"><X size={18} /></button>
                   </div>

                   <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                      {/* AI Summary Section (US-237) */}
                      <div className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Bot size={72} />
                         </div>
                         <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                               <Zap size={16} className="text-indigo-600 animate-pulse" />
                               <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">AI Task Summary</span>
                            </div>
                            <button 
                              onClick={() => {
                                setIsAiSummarizing(true);
                                setTimeout(() => setIsAiSummarizing(false), 1200);
                              }}
                              disabled={isAiSummarizing}
                              className="text-[9px] font-bold text-indigo-700 bg-white px-2 py-1 rounded shadow-sm hover:-translate-y-px transition-all"
                            >
                               {isAiSummarizing ? 'Analyzing...' : 'Gộp ý kiến chỉ đạo'}
                            </button>
                         </div>
                         <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                            {isAiSummarizing ? '...' : selectedTask.aiSummary || 'Trình AI tóm tắt các luồng thông tin liên quan từ sếp và ban kiểm soát.'}
                         </p>
                      </div>

                      {/* Content Section */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung chi đạo</h4>
                        <p className="text-xs text-text-main leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {selectedTask.description || "Chưa có nội dung mô tả chi tiết."}
                        </p>
                      </div>

                      {/* Attachments Section */}
                      {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                        <div className="space-y-2">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tệp đính kèm ({selectedTask.attachments.length})</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {selectedTask.attachments.map((file: string, i: number) => (
                                <div key={i} className="flex items-center p-2 border border-teams-border rounded-md hover:bg-gray-50 transition-colors cursor-pointer group">
                                   <FileText size={14} className="text-teams-purple mr-2" />
                                   <span className="text-[11px] font-medium text-text-secondary flex-1 truncate">{file}</span>
                                   <Plus size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* AI Smart Writing (US-236) */}
                      <div className="p-4 border-2 border-dashed border-teams-purple/20 rounded-xl bg-teams-purple/5">
                         <div className="flex items-center gap-2 mb-2">
                            <Bot size={16} className="text-teams-purple" />
                            <span className="text-[10px] font-black text-teams-purple uppercase tracking-widest">AI Smart Writing Helper</span>
                         </div>
                         <p className="text-[11px] text-text-secondary leading-relaxed mb-3 italic font-medium">
                           "Tự động chuẩn hóa lề, font chữ (Segoe UI) và kiểm tra lỗi chính tả cho báo cáo trình sếp."
                         </p>
                         <button 
                          onClick={() => {
                            setIsAiWriting(true);
                            setTimeout(() => setIsAiWriting(false), 1500);
                          }}
                          className="w-full py-1.5 bg-white border border-teams-purple text-teams-purple text-[10px] font-black rounded-lg hover:bg-teams-purple hover:text-white transition-all flex items-center justify-center gap-2"
                         >
                           {isAiWriting ? '...' : <><TrendingUp size={12} /> Chuẩn hóa văn bản trình ký</>}
                         </button>
                      </div>
                   </div>

                   {/* Detail Action Bar */}
                   <div className="p-5 border-t border-teams-border flex gap-2 bg-white sticky bottom-0">
                      {activeTab === 'Inbound' ? (
                        <button 
                          onClick={() => setShowAssignModal(true)}
                          className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                           <Send size={16} />
                           Phân việc cho nhân viên
                        </button>
                      ) : (
                        <button className="flex-1 bg-white border-2 border-teams-purple text-teams-purple py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all">
                           <MessageCircle size={16} />
                           Đôn đốc tiến độ
                        </button>
                      )}
                      <button className="w-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-center justify-center p-0 text-text-secondary"><MoreVertical size={18} /></button>
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="team-roster"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="teams-card p-5 h-full space-y-6"
                >
                   <div>
                      <h3 className="text-sm font-black text-text-main uppercase tracking-tight mb-1">Hiệu suất Đội ngũ</h3>
                      <p className="text-[10px] text-text-secondary font-medium">Thống kê khối lượng việc của từng chuyên viên</p>
                   </div>
                   
                   <div className="space-y-4">
                      {members.map(member => (
                        <div key={member.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-teams-purple/30 transition-all group">
                           <div className="flex items-center gap-3 mb-3">
                              <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-black text-text-main truncate group-hover:text-teams-purple transition-all">{member.name}</p>
                                 <p className="text-[9px] text-text-secondary font-medium italic">{member.role}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-text-main">{member.completedTasks}/{member.totalTasks}</p>
                                 <p className="text-[8px] text-gray-400 uppercase font-black tracking-tighter">Done</p>
                              </div>
                           </div>
                           <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(member.completedTasks / (member.totalTasks || 1)) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full ${member.completedTasks / member.totalTasks > 0.8 ? 'bg-green-500' : 'bg-teams-purple'}`}
                              />
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-orange-600" />
                        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Team Performance Tip</span>
                      </div>
                      <p className="text-[11px] text-orange-900/70 leading-relaxed font-medium">
                        "Anh Tuấn đang có tải trọng công việc cao nhất (15 task). Hãy cân nhắc phân bổ bớt các việc mới cho Chị Lan hoặc Anh Huy."
                      </p>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowAssignModal(false)}
               className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-60 space-y-6"
             >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-text-main">Phân công nhiệm vụ</h3>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Tạo Task cho chuyên viên trong phòng</p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-text-main"><X size={24} /></button>
                </div>

                {selectedTask && (
                   <div className="p-3 bg-teams-purple/5 border border-teams-purple/10 rounded-lg">
                      <p className="text-[9px] font-black text-teams-purple uppercase tracking-wider mb-1">Dựa trên chỉ đạo</p>
                      <p className="text-xs font-bold text-text-main line-clamp-1 italic">"{selectedTask.title}"</p>
                   </div>
                )}

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tiêu đề nhiệm vụ chi tiết</label>
                      <input 
                        type="text" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none font-bold text-sm transition-all"
                        placeholder="VD: Rà soát log hệ thống server..."
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chọn Chuyên viên</label>
                        <select 
                          className="w-full p-3 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none text-sm font-bold bg-white"
                          value={newTask.assigneeId}
                          onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                        >
                           <option value="">-- Chọn thành viên --</option>
                           {members.map(m => (
                             <option key={m.id} value={m.id}>{m.name} ({m.completedTasks}/{m.totalTasks} task)</option>
                           ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời hạn (Deadline)</label>
                        <input 
                          type="date" 
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none text-sm font-bold"
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Độ ưu tiên</label>
                      <div className="flex gap-2">
                         {(['Low', 'Medium', 'High', 'Critical'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setNewTask({...newTask, priority: p})}
                              className={`flex-1 py-2 text-[10px] font-black rounded-lg border-2 transition-all ${
                                newTask.priority === p 
                                  ? 'bg-teams-purple text-white border-teams-purple shadow-md' 
                                  : 'bg-white text-text-secondary border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                               {p}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-3 text-sm font-black text-text-secondary"
                   >
                     Hủy
                   </button>
                   <button 
                    onClick={handleAssignTask}
                    disabled={!newTask.title || !newTask.assigneeId}
                    className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-teams-purple/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                      <ArrowRight size={18} />
                      Xác nhận Phân việc
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
