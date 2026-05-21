import React, { useState, useEffect, useRef } from 'react';
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

  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [dailyLog, setDailyLog] = useState('');
  const [showSubmission, setShowSubmission] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const notesRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTask) {
       setProgress(typeof selectedTask.progress === 'number' ? selectedTask.progress : (selectedTask.status === 'Completed' ? 100 : 0));
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

  const clearSubmissionDraft = () => {
    setShowSubmission(false);
    setSubmissionFiles([]);
    setDailyLog('');
    if (notesRef.current) {
      notesRef.current.innerHTML = '';
    }
  };

  const refreshSelectedTask = async (taskId: string) => {
    const detail = await specialistService.getTaskDetail(taskId);
    setSelectedTask(detail);
    setProgress(typeof detail.progress === 'number' ? detail.progress : 0);
  };

  const openTask = async (task: TaskModel) => {
    setSelectedTask(task);
    setIsTaskLoading(true);
    try {
      clearSubmissionDraft();
      await refreshSelectedTask(task.id);
    } catch (err) {
      console.error('Failed to load task detail', err);
    } finally {
      setIsTaskLoading(false);
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
      await loadData();
      await refreshSelectedTask(selectedTask.id);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    const success = await specialistService.completeTask(selectedTask.id);
    if (success) {
      await loadData();
      await refreshSelectedTask(selectedTask.id);
    }
  };

  const getStatusLabel = (status: TaskModel['status']) => {
    if (status === 'Todo') return 'To Do';
    if (status === 'Doing') return 'In Progress';
    if (status === 'UnderReview') return 'Under Review';
    if (status === 'Rejected') return 'Rejected';
    return status;
  };

  const handleUpdateProgress = async () => {
    if (!selectedTask) return;

    setIsUpdatingProgress(true);
    try {
      const ok = await specialistService.updateTaskProgressWithLog(selectedTask.id, progress, dailyLog.trim() || undefined);
      if (ok) {
        setDailyLog('');
        await loadData();
        await refreshSelectedTask(selectedTask.id);
      }
    } catch (err) {
      console.error('Failed to update progress', err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.isArray(incoming) ? incoming : Array.from(incoming);
    if (!list.length) return;
    setSubmissionFiles((current) => [...current, ...list]);
  };

  const removeSubmissionFile = (index: number) => {
    setSubmissionFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      const notes = notesRef.current?.innerHTML || '';
      const isResubmit = selectedTask.status === 'Rejected';
      const ok = isResubmit
        ? await specialistService.resubmitTask(selectedTask.id, notes, submissionFiles)
        : await specialistService.submitTask(selectedTask.id, notes, submissionFiles);

      if (ok) {
        clearSubmissionDraft();
        await loadData();
        await refreshSelectedTask(selectedTask.id);
      }
    } catch (err) {
      console.error('Failed to submit task', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExistingFile = async (fileId: string) => {
    if (!selectedTask) return;

    try {
      const ok = await specialistService.deleteTaskFile(selectedTask.id, fileId);
      if (ok) {
        await refreshSelectedTask(selectedTask.id);
      }
    } catch (err) {
      console.error('Failed to delete file', err);
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
                          onClick={() => openTask(task)}
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
                             <span className="text-[9px] text-gray-300">|</span>
                             <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                               selectedTask.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                               selectedTask.status === 'UnderReview' ? 'bg-amber-100 text-amber-700' :
                               selectedTask.status === 'Doing' ? 'bg-blue-100 text-blue-700' :
                               selectedTask.status === 'Completed' ? 'bg-green-100 text-green-700' :
                               'bg-gray-100 text-gray-600'
                             }`}>
                               {getStatusLabel(selectedTask.status)}
                             </span>
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
                            onClick={() => setShowSubmission(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >Submit Task</button>
                        )}
                        {selectedTask.status === 'UnderReview' && (
                          <button
                            disabled
                            className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-xs font-black border border-amber-200 cursor-not-allowed"
                          >Đã gửi - chờ duyệt</button>
                        )}
                        {selectedTask.status === 'Rejected' && (
                          <button
                            onClick={() => setShowSubmission(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow-md shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >Sửa đổi &amp; Gửi lại</button>
                        )}
                        <button className="p-2 bg-white border border-teams-border rounded-lg text-text-secondary"><MoreVertical size={18} /></button>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                         {/* Description & Progress */}
                         <div className="md:col-span-7 space-y-8">
                            {isTaskLoading && (
                              <div className="p-4 bg-white border border-teams-border rounded-2xl text-xs font-bold text-gray-500">Đang tải chi tiết task...</div>
                            )}

                            {selectedTask.status === 'Rejected' && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                                <div className="text-[10px] font-black text-red-700 uppercase tracking-widest">Task bị từ chối</div>
                                <div className="text-xs text-red-800 mt-2 whitespace-pre-wrap">{selectedTask.rejectionReason || 'Chưa có lý do từ chối.'}</div>
                              </div>
                            )}

                            <section className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin chung</h3>
                                <span className="text-[10px] font-black text-teams-purple">#{selectedTask.id}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                  <div className="text-[9px] font-black text-gray-400 uppercase">Người giao</div>
                                  <div className="text-xs font-bold text-text-main mt-1">{selectedTask.sender || 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                  <div className="text-[9px] font-black text-gray-400 uppercase">Độ ưu tiên</div>
                                  <div className="text-xs font-bold text-text-main mt-1">{selectedTask.priority}</div>
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                  <div className="text-[9px] font-black text-gray-400 uppercase">Ngày tạo</div>
                                  <div className="text-xs font-bold text-text-main mt-1">{selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString() : 'N/A'}</div>
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                  <div className="text-[9px] font-black text-gray-400 uppercase">Hạn chót</div>
                                  <div className="text-xs font-bold text-text-main mt-1">{selectedTask.deadline || 'N/A'}</div>
                                </div>
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</h3>
                              <div className="p-4 bg-white border border-teams-border rounded-2xl">
                                <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{selectedTask.description || 'Không có mô tả'}</div>
                              </div>
                            </section>

                            <section className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cập nhật tiến độ</h3>
                                <span className="text-[10px] font-black text-teams-purple">{progress}%</span>
                              </div>
                              <InteractiveProgressBar value={progress} onChange={setProgress} />
                              <div className="grid grid-cols-4 gap-2">
                                {[25, 50, 75, 100].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => setProgress(v)}
                                    className={`py-1.5 rounded-lg border text-[10px] font-black transition-all ${
                                      progress === v
                                        ? 'bg-teams-purple text-white border-teams-purple'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-teams-purple/40'
                                    }`}
                                  >{v}%</button>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Báo cáo nhanh</label>
                                <textarea
                                  value={dailyLog}
                                  onChange={(e) => setDailyLog(e.target.value)}
                                  placeholder="Ví dụ: Đã thiết kế xong DB, đang viết Service"
                                  className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-teams-purple rounded-2xl outline-none text-sm font-medium resize-none transition-all"
                                  rows={3}
                                />
                                <button
                                  onClick={handleUpdateProgress}
                                  disabled={isUpdatingProgress || !selectedTask}
                                  className="w-full py-3 bg-teams-purple text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-teams-purple/20 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
                                >{isUpdatingProgress ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity log</h3>
                              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {(selectedTask.history || []).length === 0 ? (
                                  <div className="text-xs text-gray-400 italic">Chưa có log.</div>
                                ) : (
                                  (selectedTask.history || []).map((h) => (
                                    <div key={h.id} className="p-3 bg-white border border-gray-100 rounded-xl">
                                      <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black text-text-main">{h.user?.fullName || 'Bạn'} • {h.type}</div>
                                        <div className="text-[10px] font-bold text-gray-400">{new Date(h.createdAt).toLocaleString()}</div>
                                      </div>
                                      {(h.progress !== null && h.progress !== undefined) && (
                                        <div className="text-[10px] font-bold text-teams-purple mt-1">Progress: {h.progress}%</div>
                                      )}
                                      {h.content && <div className="text-xs text-text-main mt-2 whitespace-pre-wrap">{h.content}</div>}
                                    </div>
                                  ))
                                )}
                              </div>
                            </section>

                            {(showSubmission || progress >= 100 || selectedTask.status === 'Rejected') && (
                              <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nộp bài</h3>
                                  <button
                                    onClick={() => setShowSubmission((v) => !v)}
                                    className="text-[10px] font-bold text-teams-purple"
                                  >{showSubmission ? 'Ẩn' : 'Mở form'}</button>
                                </div>

                                <div
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-white hover:border-teams-purple/40 hover:bg-teams-purple/5 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-text-main">Kéo thả file hoặc chọn file</div>
                                    <label className="text-[10px] font-black px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                      Chọn file
                                      <input type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
                                    </label>
                                  </div>

                                  {submissionFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {submissionFiles.map((f, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                          <div className="text-xs font-bold text-text-main truncate">{f.name}</div>
                                          <div className="flex items-center gap-3">
                                            <div className="text-[10px] font-bold text-gray-500">{Math.round(f.size / 1024)} KB</div>
                                            <button onClick={() => removeSubmissionFile(idx)} className="text-[10px] font-black text-red-600">Xóa</button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {(selectedTask.files || []).length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">File đã nộp</div>
                                    {(selectedTask.files || []).map((f) => (
                                      <div key={f.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg">
                                        <a className="text-xs font-bold text-teams-purple truncate" href={f.url} target="_blank" rel="noreferrer">{f.nameFile}</a>
                                        <button
                                          onClick={() => handleDeleteExistingFile(f.id)}
                                          className="text-[10px] font-black text-red-600"
                                        >Xóa</button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú nộp bài (Rich Text)</div>
                                  <div
                                    ref={notesRef}
                                    contentEditable
                                    className="min-h-24 p-3 bg-white border border-gray-200 focus:border-teams-purple rounded-2xl outline-none text-sm"
                                    // placeholder="Ghi chú cho Manager..."
                                    onInput={() => { /* keep uncontrolled */ }}
                                  />
                                </div>

                                <button
                                  onClick={handleSubmit}
                                  disabled={isSubmitting}
                                  className="w-full py-3 bg-green-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-green-200 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
                                >{isSubmitting ? 'Đang gửi...' : (selectedTask.status === 'Rejected' ? 'Gửi lại cho Manager' : 'Submit Task')}</button>
                              </section>
                            )}
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
