
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Send, 
  Bot, 
  ArrowRight,
  TrendingUp,
  Search,
  MoreVertical,
  ChevronLeft,
  Calendar,
  UserCheck,
  ShieldAlert,
  Zap,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../models/user';
import { DocumentTask, Department, KPIStats, LeaderDeptPerformance } from '../../types';
import { StatCard, StatusBadge } from '../common/SharedComponents';
import { leaderService } from '../../service/leaderService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from 'recharts';

export const LeaderDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeView, setActiveView] = useState<'List' | 'Chart'>('List');
  const [pendingDocs, setPendingDocs] = useState<DocumentTask[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentTask | null>(null);
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [deptPerformance, setDeptPerformance] = useState<LeaderDeptPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Actions
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<Department | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [approvedDocId, setApprovedDocId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docs, kpi, performance, depts] = await Promise.all([
        leaderService.getPendingDocuments(),
        leaderService.getLeaderStats(),
        leaderService.getDeptPerformance(),
        leaderService.getDepartments()
      ]);
      setPendingDocs(docs);
      setStats(kpi);
      setDeptPerformance(performance);
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to load leader dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadManager = async () => {
      if (!selectedDept) {
        setSelectedManager(null);
        return;
      }

      try {
        const managerInfo = await leaderService.getDeptManager(selectedDept);
        setSelectedManager(managerInfo);
      } catch (err) {
        console.error('Failed to load department manager', err);
        setSelectedManager(null);
      }
    };

    loadManager();
  }, [selectedDept]);

  const handleApprove = async () => {
    if (!selectedDoc) return;
    const success = await leaderService.approveDocument(selectedDoc.id);
    if (success) {
      setApprovedDocId(selectedDoc.id);
      setSelectedDept('');
      setSelectedManager(null);
      setShowForwardModal(true);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectReason) return;
    const success = await leaderService.rejectDocument(selectedDoc.id, rejectReason);
    if (success) {
      setPendingDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      setSelectedDoc(null);
      setShowRejectInput(false);
      setRejectReason('');
      setApprovedDocId(null);
    }
  };

  const handleForward = async () => {
    if (!selectedDoc || !selectedDept || approvedDocId !== selectedDoc.id) return;
    const success = await leaderService.assignDepartment(selectedDoc.id, selectedDept);
    if (success) {
      setPendingDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      setSelectedDoc(null);
      setShowForwardModal(false);
      setSelectedDept('');
      setSelectedManager(null);
      setApprovedDocId(null);
      if (stats) setStats({ ...stats, pendingApprovals: Math.max(stats.pendingApprovals - 1, 0) });
    }
  };

  const currentManager = selectedManager;

  const formatDate = (dateText?: string) => {
    if (!dateText) return '';

    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) {
      return dateText;
    }

    return parsed.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-teams-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-text-secondary">Đang tải dữ liệu nghiệp vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight leading-tight">
            Quản trị & Điều hành <span className="text-teams-purple italic">eOffice</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Hệ thống đang hỗ trợ bạn xử lý <strong>{pendingDocs.length}</strong> văn bản khẩn cấp.</p>
        </div>
        <div className="flex bg-white rounded-lg border border-teams-border p-1 shadow-sm">
           <button 
            onClick={() => setActiveView('List')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeView === 'List' ? 'bg-teams-purple text-white' : 'text-text-secondary hover:bg-gray-100'}`}
           >
              <FileText size={14} />
              <span>Phê duyệt</span>
           </button>
           <button 
            onClick={() => setActiveView('Chart')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeView === 'Chart' ? 'bg-teams-purple text-white' : 'text-text-secondary hover:bg-gray-100'}`}
           >
              <BarChart3 size={14} />
              <span>Báo cáo</span>
           </button>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Văn bản chờ duyệt" value={stats?.pendingApprovals.toString() || '0'} trend="+2 từ sáng" />
        <StatCard title="Tổng số văn bản" value={stats?.totalDocs.toLocaleString() || '0'} trend="+12% tháng này" />
        <StatCard title="Hiệu suất xử lý" value={`${stats?.efficiency}%`} trend="+0.5%" color="text-green-600" />
        <StatCard title="Thời gian trung bình" value={stats?.processingTime || ''} trend="-15% tối ưu" color="text-blue-600" />
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'List' ? (
          <motion.div 
            key="list-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* List Column */}
            <div className={`transition-all duration-500 overflow-hidden ${selectedDoc ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <div className="teams-card h-full min-h-125 flex flex-col">
                <div className="p-4 border-b border-teams-border flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
                    <Clock size={16} className="text-teams-purple" />
                    Hộp thư phê duyệt
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm..."
                      className="pl-8 pr-4 py-1.5 bg-white border border-teams-border rounded-md text-[11px] outline-none focus:border-teams-purple w-40"
                    />
                  </div>
                </div>

                <div className="divide-y divide-teams-border overflow-y-auto max-h-150 custom-scrollbar">
                  {pendingDocs.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary italic text-sm">Tất cả văn bản đã được xử lý xong.</div>
                  ) : (
                    pendingDocs.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`p-4 hover:bg-teams-purple/5 cursor-pointer transition-all border-l-4 ${selectedDoc?.id === doc.id ? 'bg-teams-purple/5 border-l-teams-purple' : 'border-l-transparent'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            doc.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
                            doc.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {doc.priority === 'Critical' ? 'HỎA TỐC' : doc.priority === 'High' ? 'KHẨN' : 'THƯỜNG'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDate(doc.startTime ?? doc.date)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-text-main group-hover:text-teams-purple transition-colors line-clamp-2">{doc.title}</h3>
                        <div className="mt-2 flex items-center justify-between">
                           <span className="text-[11px] text-text-secondary font-medium tracking-tight truncate max-w-50">Phát hành: {doc.sender}</span>
                           <StatusBadge status={doc.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detail Column */}
            <AnimatePresence>
              {selectedDoc && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-7"
                >
                  <div className="teams-card min-h-150 flex flex-col sticky top-6">
                    {/* Detail Header */}
                    <div className="p-5 border-b border-teams-border flex justify-between items-center bg-gray-50/50">
                       <button onClick={() => setSelectedDoc(null)} className="shrink-0 p-2 hover:bg-gray-100 rounded-full lg:hidden">
                          <ChevronLeft size={20} />
                       </button>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teams-purple/10 flex items-center justify-center rounded-lg shadow-sm border border-teams-purple/20">
                             <FileText size={20} className="text-teams-purple" />
                          </div>
                          <div>
                             <h2 className="font-bold text-sm text-text-main line-clamp-1">{selectedDoc.title}</h2>
                             <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">{selectedDoc.id} • {selectedDoc.type}</p>
                          </div>
                       </div>
                       <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical size={18} /></button>
                    </div>

                    {/* Detail Body */}
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                       {/* AI Smart Assistant Area */}
                       <div className="relative overflow-hidden p-5 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <Zap size={64} className="text-indigo-600" />
                          </div>
                          <div className="relative z-10 space-y-4">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-2 text-indigo-700">
                                  <Bot size={20} className="animate-bounce" />
                                  <span className="text-xs font-black uppercase tracking-widest">AI Smart Assistant</span>
                               </div>
                               <button 
                                onClick={() => {
                                  setIsAiSummarizing(true);
                                  setTimeout(() => setIsAiSummarizing(false), 800);
                                }}
                                className="bg-white/80 hover:bg-white px-3 py-1.5 rounded-full text-[10px] font-black text-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
                               >
                                  {isAiSummarizing ? '...' : <><Zap size={12} /> Tóm tắt nhanh</>}
                               </button>
                             </div>

                             <AnimatePresence>
                               {isAiSummarizing ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                                     <div className="h-4 bg-indigo-200/50 rounded w-full animate-pulse"></div>
                                  </motion.div>
                               ) : (
                                  <div className="space-y-3">
                                     <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                                       "{selectedDoc.summary}"
                                     </p>
                                     {selectedDoc.legalWarnings && selectedDoc.legalWarnings.length > 0 && (
                                       <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                          <div className="flex items-center gap-2 text-red-700 font-bold text-[10px] uppercase mb-1.5">
                                             <ShieldAlert size={14} />
                                             <span>Cảnh báo pháp lý quan trọng</span>
                                          </div>
                                          <ul className="list-disc list-inside space-y-1 text-xs text-red-900/70 italic">
                                             {selectedDoc.legalWarnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                          </ul>
                                       </div>
                                     )}
                                  </div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>

                       {/* Content Content */}
                       <div className="space-y-3">
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nội dung chi tiết</h4>
                          <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-text-main leading-relaxed shadow-inner">
                            {selectedDoc.content || "Nội dung văn bản đang được cập nhật..."}
                          </div>
                       </div>

                       {/* Attachments (Mock) */}
                       <div className="space-y-3">
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tệp đính kèm</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div className="flex items-center p-3 border border-teams-border rounded-lg hover:border-teams-purple cursor-pointer transition-all group">
                                <div className="p-2 bg-red-50 text-red-500 rounded mr-3">
                                   <FileText size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <p className="text-xs font-bold text-text-main truncate">Ho-so-quyet-toan.pdf</p>
                                   <p className="text-[10px] text-gray-400">4.5 MB • PDF</p>
                                </div>
                             </div>
                             <div className="flex items-center p-3 border border-teams-border rounded-lg hover:border-teams-purple cursor-pointer transition-all group">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded mr-3">
                                   <Calendar size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <p className="text-xs font-bold text-text-main truncate">Lich-trinh-thi-cong.xlsx</p>
                                   <p className="text-[10px] text-gray-400">1.2 MB • Excel</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-5 border-t border-teams-border bg-white flex flex-col gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                       {showRejectInput && (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-bold text-red-600 uppercase">Lý do từ chối:</label>
                            <textarea 
                              className="w-full p-3 border-2 border-red-100 rounded-xl outline-none focus:border-red-500 text-sm h-24"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Nhập lý do chi tiết..."
                            />
                            <div className="flex justify-end gap-2">
                               <button onClick={() => setShowRejectInput(false)} className="text-xs font-bold text-text-secondary px-4">Hủy</button>
                               <button onClick={handleReject} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-200">Xác nhận Từ chối</button>
                            </div>
                         </motion.div>
                       )}

                       {!showRejectInput && (
                         <div className="flex flex-wrap gap-3">
                            <button 
                              onClick={handleApprove}
                              disabled={approvedDocId === selectedDoc.id}
                              className="flex-1 min-w-50 bg-teams-purple text-white py-3 rounded-xl text-sm font-black flex items-center justify-center space-x-2 shadow-lg shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                               <CheckCircle size={18} />
                               <span>{approvedDocId === selectedDoc.id ? 'Đã ký duyệt' : 'Phê duyệt & Ký số'}</span>
                            </button>
                            
                            <button 
                              onClick={() => setShowForwardModal(true)}
                              disabled={approvedDocId !== selectedDoc.id}
                              className="flex-1 bg-white border-2 border-teams-purple/20 text-teams-purple py-3 rounded-xl text-sm font-black flex items-center justify-center space-x-2 hover:bg-teams-purple/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <Send size={18} />
                               <span>Bước 2: Chọn phòng ban</span>
                            </button>

                            <button 
                              onClick={() => setShowRejectInput(true)}
                              className="w-12 h-12 bg-red-50 border-2 border-red-100 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                               <XCircle size={20} />
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="chart-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Chart 1: Performance */}
            <div className="teams-card p-8 space-y-6 shadow-xl shadow-teams-purple/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-text-main tracking-tight">Hiệu suất phòng ban</h3>
                  <p className="text-xs text-text-secondary font-medium">Tỷ lệ hoàn thành nhiệm vụ theo chỉ tiêu Quý</p>
                </div>
                <TrendingUp size={24} className="text-green-500" />
              </div>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#616161' }} />
                    <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {deptPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6264A7' : '#A18CD1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Trends */}
            <div className="teams-card p-8 space-y-6 shadow-xl shadow-teams-purple/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-text-main tracking-tight">Tăng trưởng xử lý</h3>
                  <p className="text-xs text-text-secondary font-medium">Số lượng hồ sơ bứt phá trong 30 ngày qua</p>
                </div>
                <Zap size={24} className="text-yellow-500" />
              </div>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                     { name: 'W1', value: 30 },
                     { name: 'W2', value: 55 },
                     { name: 'W3', value: 45 },
                     { name: 'W4', value: 80 },
                     { name: 'W5', value: 95 },
                   ]}>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#6264A7" strokeWidth={4} fillOpacity={1} fill="url(#colorPv)" />
                      <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6264A7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6264A7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                   </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowForwardModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-60 space-y-6"
            >
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-text-main">Chuyển phòng ban xử lý</h3>
                  <button onClick={() => setShowForwardModal(false)} className="text-gray-400"><XCircle size={24} /></button>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chọn phòng ban chuyên môn</label>
                    <select 
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none transition-all font-bold text-sm"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                    >
                      <option value="">-- Vui lòng chọn --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <AnimatePresence>
                    {selectedDept && currentManager && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-teams-purple/5 border-2 border-teams-purple/10 rounded-xl flex items-center space-x-4"
                      >
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <UserCheck className="text-teams-purple" size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-teams-purple uppercase">Trưởng phòng phụ trách</p>
                            <p className="text-sm font-black text-text-main">{currentManager.managerName}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">Sẽ nhận được chỉ đạo ngay khi bạn nhấn Gửi</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => setShowForwardModal(false)}
                    className="flex-1 py-3 text-sm font-black text-text-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleForward}
                    disabled={!selectedDept || approvedDocId !== selectedDoc?.id}
                    className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-teams-purple/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={18} />
                    <span>Xác nhận Gửi</span>
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
