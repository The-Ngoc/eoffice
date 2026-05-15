import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Bot, 
  CheckCircle, 
  Plus, 
  Search, 
  MessageCircle, 
  Bell, 
  Calendar, 
  Video, 
  Upload, 
  Zap, 
  Layout, 
  Send, 
  LogOut,
  ChevronRight,
  MoreVertical,
  X,
  Languages,
  Sparkles,
  FileSearch,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, TaskModel, Meeting, ChatMessage } from '../../types';
import { StatCard, ToolCard, InteractiveProgressBar } from '../common/SharedComponents';
import { specialistService } from '../../service/specialService';

export const SpecialistDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<TaskModel[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'ai' | 'meetings'>('tasks');
  const [progress, setProgress] = useState(0);
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTask) {
       // Reset progress when selecting a task - in real app would fetch actual progress
       setProgress(selectedTask.status === 'Completed' ? 100 : 30);
    }
  }, [selectedTask]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [t, m, msg] = await Promise.all([
        specialistService.getTasks(),
        specialistService.getMeetings(),
        specialistService.getMessages()
      ]);
      setTasks(t);
      setMeetings(m);
      setMessages(msg);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiAction = async (action: 'decode' | 'draft' | 'search') => {
    setIsAiLoading(true);
    setAiOutput('');
    try {
      let result;
      if (action === 'decode') result = await specialistService.aiDecoder(aiInput);
      else if (action === 'draft') result = await specialistService.aiDraft(aiInput);
      else if (action === 'search') {
        const results = await specialistService.aiSearch(semanticQuery);
        setSearchResults(results);
        setIsAiLoading(false);
        return;
      }
      setAiOutput(result || '');
    } catch (err) {
      console.error('AI Error', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptTask = async () => {
    if (!selectedTask) return;
    const success = await specialistService.acceptTask(selectedTask.id);
    if (success) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, status: 'Doing' } : t));
      setSelectedTask({ ...selectedTask, status: 'Doing' });
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    const success = await specialistService.completeTask(selectedTask.id);
    if (success) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, status: 'Completed' } : t));
      setSelectedTask({ ...selectedTask, status: 'Completed' });
      setProgress(100);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* SSO & Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight leading-tight">
            Hi, {user.fullName.split(' ').pop()} <span className="text-teams-purple font-medium text-sm ml-2">Digital Workspace</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">Bắt đầu ngày làm việc hiệu quả với trợ lý AI và công cụ eOffice.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-teams-border px-4 py-2 rounded-lg text-xs font-bold hover:shadow-sm transition-all text-text-main shadow-sm">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="MS" className="w-4 h-4" />
            <span>Xác thực O365</span>
          </button>
          <div className="flex items-center space-x-2 bg-purple-50 text-teams-purple px-3 py-2 rounded-lg border border-purple-100">
             <Bell size={16} />
             <span className="text-[10px] font-black uppercase">3 thông báo mới</span>
          </div>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Việc cần làm" value={tasks.filter(t => t.status !== 'Completed').length.toString()} trend="Hạn cuối tuần này" />
        <StatCard title="Lịch họp" value={meetings.length.toString()} trend="Hôm nay" color="text-blue-600" />
        <StatCard title="Efficiency Score" value="92/100" trend="+4.5%" color="text-green-600" />
        <StatCard title="AI Credits" value="450" trend="Unlimited" color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-150">
        {/* Left Column: Tasks & Meetings */}
        <div className={`transition-all duration-500 ${selectedTask ? 'lg:col-span-4' : 'lg:col-span-8'}`}>
          <div className="space-y-6 h-full flex flex-col">
            {/* Task List */}
            <div className="teams-card flex-1 flex flex-col min-h-100">
              <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                   <Layout size={18} className="text-teams-purple" />
                   <h2 className="font-bold text-sm text-text-main">Trung tâm nhiệm vụ</h2>
                 </div>
                 <div className="flex bg-white rounded-md border border-teams-border p-0.5">
                   <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${activeTab === 'tasks' ? 'bg-teams-purple text-white shadow-md' : 'text-text-secondary hover:bg-gray-100'}`}
                   >Tasks</button>
                   <button 
                    onClick={() => setActiveTab('meetings')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${activeTab === 'meetings' ? 'bg-teams-purple text-white shadow-md' : 'text-text-secondary hover:bg-gray-100'}`}
                   >Lịch họp</button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <AnimatePresence mode="wait">
                  {activeTab === 'tasks' ? (
                    <motion.div 
                      key="tasks-list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {tasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedTask?.id === task.id ? 'bg-teams-purple/5 border-teams-purple ring-1 ring-teams-purple/20' : 'bg-white border-teams-border hover:border-teams-purple/30'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">#{task.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              task.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                              task.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-text-main line-clamp-1 group-hover:text-teams-purple transition-all">{task.title}</h3>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-text-secondary">
                             <div className="flex items-center gap-1 font-medium">
                               <Plus size={12} />
                               <span>Sếp {task.sender}</span>
                             </div>
                             <div className="flex items-center gap-1 font-bold italic">
                               <Calendar size={12} />
                               <span>Hạn: {task.deadline}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="meetings-list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 p-2"
                    >
                      {meetings.map(meet => (
                        <div key={meet.id} className="p-4 bg-white border border-teams-border rounded-xl hover:shadow-sm transition-all flex items-center gap-4 group">
                           <div className="w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-600">
                             <span className="text-[10px] font-black leading-none">TH4</span>
                             <span className="text-lg font-black leading-none">{new Date(meet.startTime).getDate()}</span>
                           </div>
                           <div className="flex-1">
                             <h4 className="text-sm font-bold text-text-main group-hover:text-blue-600 transition-all">{meet.title}</h4>
                             <p className="text-[10px] text-text-secondary font-medium">
                               {new Date(meet.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {meet.platform}
                             </p>
                           </div>
                           <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black shadow-md shadow-blue-200 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-2">
                             <Video size={14} />
                             Tham gia
                           </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Semantic Search AI Section */}
            <div className="teams-card p-5 bg-linear-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <FileSearch size={120} />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center">
                        <Sparkles size={16} className="text-indigo-300" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Semantic AI Search</h3>
                        <p className="text-[9px] text-indigo-200 font-medium italic">"Mô tả ý tưởng để tìm hồ sơ cũ"</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={semanticQuery}
                        onChange={(e) => setSemanticQuery(e.target.value)}
                        placeholder="Tìm hồ sơ về dự án CNTT năm ngoái..."
                        className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white/10 focus:border-indigo-400 placeholder:text-white/30 transition-all"
                     />
                     <button 
                      onClick={() => handleAiAction('search')}
                      className="bg-indigo-500 hover:bg-indigo-400 px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                     >
                       {isAiLoading ? 'Searching...' : 'Tìm ngay'}
                     </button>
                  </div>
                  {searchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-2 mt-4"
                    >
                      {searchResults.map((res, i) => (
                        <div key={i} className="bg-white/10 p-2 rounded-lg border border-white/10 text-[10px] font-bold flex items-center gap-2 hover:bg-white/20 cursor-pointer">
                           <FileText size={12} className="text-indigo-300" />
                           <span className="truncate">{res}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detail Workarea */}
        <div className={`transition-all duration-500 ${selectedTask ? 'lg:col-span-8' : 'lg:col-span-4'}`}>
           <AnimatePresence mode="wait">
              {selectedTask ? (
                <motion.div 
                  key="task-workspace"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="teams-card flex flex-col h-full overflow-hidden"
                >
                   <div className="p-4 border-b border-teams-border flex justify-between items-center bg-gray-50/80 sticky top-0 z-20">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-text-main"><X size={20} /></button>
                        <div>
                          <h2 className="text-sm font-black text-text-main line-clamp-1">{selectedTask.title}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[9px] font-bold text-teams-purple uppercase tracking-tighter">Gửi bởi: {selectedTask.sender}</span>
                             <span className="text-[9px] text-gray-300">|</span>
                             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Hạn: {selectedTask.deadline}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTask.status === 'Todo' && (
                          <button 
                            onClick={handleAcceptTask}
                            className="bg-teams-purple text-white px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >Xác nhận nhận việc</button>
                        )}
                        {selectedTask.status === 'Doing' && (
                          <button 
                            onClick={handleCompleteTask}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >Hoàn thành</button>
                        )}
                        <button className="p-2 bg-white border border-teams-border rounded-lg text-text-secondary"><MoreVertical size={18} /></button>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                         {/* Description & Progress */}
                         <div className="md:col-span-7 space-y-8">
                            <section className="space-y-3">
                               <div className="flex items-center gap-2">
                                  <Zap size={16} className="text-orange-500" />
                                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chỉ đạo từ cấp trên</h3>
                               </div>
                               <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl relative overflow-hidden">
                                  <Bot size={80} className="absolute -right-4 -bottom-4 text-orange-200/40" />
                                  <p className="text-xs text-text-main leading-relaxed font-medium italic relative z-10">"{selectedTask.aiSummary || selectedTask.description}"</p>
                               </div>
                            </section>

                            <section className="space-y-4">
                               <InteractiveProgressBar value={progress} onChange={setProgress} />
                               <div className="grid grid-cols-3 gap-2">
                                  {[0, 50, 100].map(v => (
                                    <button 
                                      key={v}
                                      onClick={() => setProgress(v)}
                                      className={`py-1.5 rounded-lg border text-[10px] font-black transition-all ${progress === v ? 'bg-teams-purple text-white border-teams-purple' : 'bg-white text-gray-400 border-gray-100'}`}
                                    >
                                      {v === 0 ? 'Chưa làm' : v === 50 ? 'Đang làm' : 'Xong'}
                                    </button>
                                  ))}
                               </div>
                            </section>

                            <section className="space-y-3">
                               <div className="flex items-center justify-between">
                                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm đầu ra</h3>
                                  <button className="text-[10px] font-bold text-teams-purple flex items-center gap-1">
                                    <Plus size={12} />
                                    <span>Template mẫu</span>
                                  </button>
                               </div>
                               <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 hover:border-teams-purple/40 hover:bg-teams-purple/5 transition-all cursor-pointer group">
                                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:text-teams-purple transition-all">
                                    <Upload size={24} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-text-main">Tải lên file kết quả xử lý</p>
                                    <p className="text-[10px] text-text-secondary mt-1">Kéo thả PDF, Word, hoặc Excel vào đây</p>
                                  </div>
                               </div>
                            </section>
                         </div>

                         {/* Context & Discussion (Sidebar) */}
                         <div className="md:col-span-5 space-y-6">
                            <section className="space-y-3">
                               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bối cảnh chỉ đạo</h3>
                               <div className="space-y-3 relative before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                  {[
                                    { role: 'Giám đốc', text: 'Cần dự thảo sớm để trình ký.', time: '2h trước' },
                                    { role: 'Trưởng phòng', text: 'Lưu ý phần ngân sách.', time: '1h trước' }
                                  ].map((node, i) => (
                                    <div key={i} className="flex gap-4 relative">
                                      <div className="w-6 h-6 rounded-full bg-white border-2 border-teams-purple flex items-center justify-center z-10">
                                        <div className="w-2 h-2 bg-teams-purple rounded-full" />
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-text-main">{node.role}</p>
                                        <p className="text-[10px] text-text-secondary italic">"{node.text}"</p>
                                        <p className="text-[8px] text-gray-400 uppercase font-bold">{node.time}</p>
                                      </div>
                                    </div>
                                  ))}
                               </div>
                            </section>

                            <section className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                               <div className="flex items-center justify-between">
                                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <MessageCircle size={14} />
                                   Thảo luận nội bộ
                                 </h3>
                                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                               </div>
                               <div className="space-y-3 max-h-37.5 overflow-y-auto custom-scrollbar pr-2">
                                  {messages.map(msg => (
                                    <div key={msg.id} className="space-y-1">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-teams-purple">{msg.senderName}</span>
                                          <span className="text-[8px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                       </div>
                                       <p className="text-[11px] text-text-main leading-snug bg-white p-2 rounded-lg border border-gray-100 shadow-sm">{msg.content}</p>
                                    </div>
                                  ))}
                               </div>
                               <div className="relative">
                                  <input 
                                    type="text" 
                                    placeholder="@Tag đồng nghiệp..." 
                                    className="w-full bg-white border border-teams-border rounded-xl px-3 py-2 text-xs outline-none focus:border-teams-purple transition-all pr-10 shadow-inner"
                                  />
                                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-teams-purple hover:scale-110 transition-all"><Send size={14} /></button>
                               </div>
                            </section>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="ai-assistant"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="teams-card p-0 flex flex-col h-full bg-white"
                >
                   <div className="p-4 border-b border-teams-border bg-linear-to-r from-teams-purple to-indigo-600 text-white">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                            <Bot size={22} className="text-white" />
                         </div>
                         <div>
                            <h2 className="text-sm font-black uppercase tracking-widest">AI Specialist Assistant</h2>
                            <p className="text-[10px] text-white/70 font-medium italic">"Hỗ trợ soạn thảo và giải mã nghiệp vụ"</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 flex-1 flex flex-col space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className="p-4 border-2 border-gray-50 rounded-2xl flex flex-col items-center gap-3 hover:border-teams-purple/20 hover:bg-teams-purple/5 transition-all group"
                        >
                           <Languages size={24} className="text-blue-500 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Dịch thuật</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('ai')}
                          className="p-4 border-2 border-gray-50 rounded-2xl flex flex-col items-center gap-3 hover:border-teams-purple/20 hover:bg-teams-purple/5 transition-all group"
                        >
                           <Sparkles size={24} className="text-orange-500 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Soạn dự thảo</span>
                        </button>
                        <button 
                          className="p-4 border-2 border-gray-50 rounded-2xl flex flex-col items-center gap-3 hover:border-teams-purple/20 hover:bg-teams-purple/5 transition-all group"
                        >
                           <CheckCircle size={24} className="text-green-500 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Soát lỗi</span>
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col space-y-4">
                         <div className="space-y-1.5 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhập yêu cầu / Nội dung gốc</label>
                            <textarea 
                              value={aiInput}
                              onChange={(e) => setAiInput(e.target.value)}
                              placeholder="Nhập nội dung cần giải mã hoặc prompt soạn thảo..."
                              className="w-full flex-1 p-4 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-2xl outline-none text-sm font-medium resize-none transition-all placeholder:text-gray-300"
                            />
                         </div>

                         <div className="flex gap-3">
                            <button 
                              onClick={() => handleAiAction('decode')}
                              disabled={!aiInput || isAiLoading}
                              className="flex-1 py-3 bg-white border-2 border-teams-purple text-teams-purple rounded-xl text-[11px] font-black uppercase hover:bg-teams-purple hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >Giải mã điều luật</button>
                            <button 
                              onClick={() => handleAiAction('draft')}
                              disabled={!aiInput || isAiLoading}
                              className="flex-1 py-3 bg-teams-purple text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-teams-purple/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                            >Soạn thảo tự động</button>
                         </div>
                      </div>

                      <AnimatePresence>
                        {aiOutput && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl space-y-3"
                          >
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Kết quả AI gợi ý</span>
                               <button className="text-[10px] font-bold text-indigo-700 hover:underline">Phân rã thành việc</button>
                             </div>
                             <div className="text-xs text-indigo-900 leading-relaxed font-medium whitespace-pre-wrap">{aiOutput}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
