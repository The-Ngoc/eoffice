import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Users,
  Plus,
  Search,
  Send,
  Bot,
  MessageCircle,
  MoreVertical,
  X,
  AlertCircle,
  TrendingUp,
  Layout,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../models/User.ts';
import { DepartmentMember } from '../../models/Department';
import { DocumentFile, DocumentFlowHistoryItem } from '../../models/Document';
import { KPIStats } from '../../models/Stats';
import { TaskModel , TaskLeader } from '../../models/Task';
import { managerService } from '../../service/ManagerService';
import { StatCard } from '../common/SharedComponents';
import { departmentMemberService } from '../../service/DepartmentMemberService';
import { getDocumentFiles } from '../../service/clericalService';

type PriorityFilter = 'Low' | 'Medium' | 'High' | 'Critical';

type ActionMessage = {
  type: 'success' | 'error';
  text: string;
};

const priorityLabelMap: Record<PriorityFilter, string> = {
  Low: 'THƯỜNG',
  Medium: 'THƯỜNG',
  High: 'KHẨN',
  Critical: 'HỎA TỐC',
};

const priorityApiMap: Record<PriorityFilter, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'URGENT',
};

const getLeaderTaskTitle = (task?: TaskLeader | null) => {
  return task?.document?.title || task?.note || task?.document?.documentNumber || task?.id || 'Chưa có tiêu đề';
};

const getLeaderTaskPriority = (task?: TaskLeader | null): PriorityFilter => {
  const priority = (task?.document?.priority ?? '').toUpperCase();
  const urgency = (task?.document?.urgency ?? '').toUpperCase();

  if (priority === 'URGENT' || priority === 'CRITICAL' || urgency === 'HỎA TỐC' || urgency === 'HOA TOC') return 'Critical';
  if (priority === 'HIGH' || urgency === 'KHẨN' || urgency === 'KHAN') return 'High';
  if (priority === 'MEDIUM') return 'Medium';

  return 'Low';
};

const getLeaderTaskStatus = (task?: TaskLeader | null) => {
  return task?.document?.status || 'Pending';
};

const getLeaderTaskDeadline = (task?: TaskLeader | null) => {
  return task?.deadline || task?.document?.dueDate || '';
};

const getLeaderTaskDepartmentName = (task?: TaskLeader | null) => {
  return task?.department?.name || task?.document?.departmentName || 'Chưa rõ phòng ban';
};

const getLeaderTaskOwnerName = (task?: TaskLeader | null) => {
  return task?.department?.managerName || task?.document?.sender || 'Chưa phân công';
};

const getLeaderTaskFiles = (task?: TaskLeader | null) => {
  return task?.document?.files ?? [];
};

const getLeaderTaskHistory = (task?: TaskLeader | null) => {
  return task?.document?.flowHistory ?? [];
};

const getTaskDocumentId = (task?: TaskModel | TaskLeader | null) => {
  if (!task) return null;

  if ('documentId' in task && task.documentId) {
    return task.documentId;
  }

  return task.document?.id ?? null;
};

const getTaskDescription = (task?: TaskModel | TaskLeader | null) => {
  if (!task) return '';

  if ('description' in task && task.description) {
    return task.description;
  }

  return task.document?.description || task.note || '';
};

const getTaskTitle = (task?: TaskModel | TaskLeader | null) => {
  if (!task) return 'Chưa có tiêu đề';

  if ('title' in task && task.title) {
    return task.title;
  }

  return getLeaderTaskTitle(task as TaskLeader);
};

const getAssignedTaskPriority = (task?: TaskModel | null): PriorityFilter => {
  const priority = (task?.priority ?? task?.document?.priority ?? '').toUpperCase();
  const urgency = (task?.document?.urgency ?? '').toUpperCase();

  if (priority === 'URGENT' || priority === 'CRITICAL' || urgency === 'HỎA TỐC' || urgency === 'HOA TOC') return 'Critical';
  if (priority === 'HIGH' || urgency === 'KHẨN' || urgency === 'KHAN') return 'High';
  if (priority === 'MEDIUM') return 'Medium';

  return 'Low';
};

const getAssignedTaskStatus = (task?: TaskModel | null) => {
  const status = (task?.status ?? task?.document?.status ?? '').toUpperCase();

  if (status === 'DONE' || status === 'COMPLETED') return 'Completed';
  if (status === 'OVERDUE' || task?.isOverdue) return 'Overdue';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'IN_PROGRESS' || status === 'DOING' || status === 'PROCESSING' || status === 'APPROVED') return 'Doing';
  if (status === 'UNDER_REVIEW' || status === 'WAITING_APPROVAL') return 'UnderReview';

  return 'Todo';
};

const getAssignedTaskTitle = (task?: TaskModel | null) => {
  return task?.document?.title || task?.title || task?.document?.documentNumber || task?.id || 'Chưa có tiêu đề';
};

const getAssignedTaskOwnerName = (task?: TaskModel | null) => {
  return task?.member?.user?.fullName || task?.assignee?.fullName || task?.assigneeName || 'Chưa gán';
};

const getAssignedTaskOwnerEmail = (task?: TaskModel | null) => {
  return task?.member?.user?.email || task?.assignee?.email || task?.assigneeEmail || 'Không có email';
};

const getAssignedTaskDepartmentName = (task?: TaskModel | null) => {
  return task?.document?.departmentName || task?.departmentName || 'Chưa rõ phòng ban';
};

const getAssignedTaskDocumentNumber = (task?: TaskModel | null) => {
  return task?.document?.documentNumber || task?.documentNumber || task?.documentId || task?.id || 'Không có mã';
};

const getAssignedTaskDeadline = (task?: TaskModel | null) => {
  return task?.deadline || task?.dueDate || task?.document?.dueDate || '';
};

const getAssignedTaskFiles = (task?: TaskModel | null) => {
  return task?.files ?? [];
};

const getAssignedTaskHistory = (task?: TaskModel | null): DocumentFlowHistoryItem[] => {
  return task?.document?.flowHistory ?? [];
};

const getAssignedTaskProgress = (task?: TaskModel | null) => {
  return Math.max(0, Math.min(task?.progress ?? 0, 100));
};

export const ManagerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'LeaderTasks' | 'AssignedTasks'>('LeaderTasks');
  const [inboundTasks, setInboundTasks] = useState<TaskLeader[]>([]);
  const [teamTasks, setTeamTasks] = useState<TaskModel[]>([]);
  const [members, setMembers] = useState<DepartmentMember[]>([]);

  const [stats, setStats] = useState<KPIStats>({
    totalDocs: 0,
    pendingApprovals: 0,
    processingTime: '0 ngày',
    efficiency: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeaderTask, setSelectedLeaderTask] = useState<TaskLeader | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentAttachments, setDocumentAttachments] = useState<DocumentFile[]>([]);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isPublishingDocument, setIsPublishingDocument] = useState(false);
  const [isRejectingPublish, setIsRejectingPublish] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  const [documentTasksByDocumentId, setDocumentTasksByDocumentId] = useState<Record<string, TaskModel[]>>({});
  const [loadingDocumentTasksForDocumentId, setLoadingDocumentTasksForDocumentId] = useState<string | null>(null);
  const [documentTasksError, setDocumentTasksError] = useState('');
  const [newTask, setNewTask] = useState<Partial<TaskModel>>({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
    deadline: '',
  });

  const departmentId = useMemo(() => {
    return selectedLeaderTask?.department?.id || inboundTasks.find((task) => task.department?.id)?.department?.id || null;
  }, [selectedLeaderTask, inboundTasks]);

  const sortedInboundTasks = useMemo(() => {
    return [...inboundTasks].sort((left, right) => {
      const leftAssigned = left.department?.managerId ? 1 : 0;
      const rightAssigned = right.department?.managerId ? 1 : 0;

      if (leftAssigned !== rightAssigned) {
        return leftAssigned - rightAssigned;
      }

      return 0;
    });
  }, [inboundTasks]);

  const selectedTaskHasAssignee = Boolean(
    activeTab === 'AssignedTasks' && (selectedTask?.memberId || selectedTask?.member?.user?.id || selectedTask?.assignee?.id),
  );
  const shouldShowReminderAction = activeTab === 'AssignedTasks' && selectedTaskHasAssignee;
  const assignSourceTask = activeTab === 'LeaderTasks' ? selectedLeaderTask : selectedTask;
  const assignSourceDocumentId = getTaskDocumentId(assignSourceTask);
  const selectedTaskDocumentId = getTaskDocumentId(selectedTask);
  const selectedTaskProgress = getAssignedTaskProgress(selectedTask);
  const selectedTaskStatus = getAssignedTaskStatus(selectedTask);
  const selectedTaskDocumentTasks = selectedTaskDocumentId ? documentTasksByDocumentId[selectedTaskDocumentId] ?? [] : [];
  const isLoadingSelectedDocumentTasks = Boolean(
    selectedTaskDocumentId && loadingDocumentTasksForDocumentId === selectedTaskDocumentId,
  );
  const canPublishAssignedTask = activeTab === 'AssignedTasks' && selectedTaskProgress >= 100 && Boolean(selectedTaskDocumentId);



  const computeStats = (tasks: TaskModel[]) => {
    const totalDocs = tasks.length;
    const pendingApprovals = tasks.filter((task) => {
      const status = getAssignedTaskStatus(task);
      return status === 'Todo' || status === 'Doing';
    }).length;
    const overdueCount = tasks.filter((task) => getAssignedTaskStatus(task) === 'Overdue').length;
    const completedCount = tasks.filter((task) => getAssignedTaskStatus(task) === 'Completed').length;
    const efficiency = totalDocs === 0 ? 0 : Math.round((completedCount / totalDocs) * 100);

    return {
      totalDocs,
      pendingApprovals,
      processingTime: `${Math.max(1, Math.ceil(totalDocs / 4))} ngày`,
      efficiency,
      overdueCount,
    };
  };

  const resetAssignForm = () => {
    setSelectedMemberId('');
    setSelectedFiles([]);
    setDocumentAttachments([]);
    setAssignError('');
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Todo',
      deadline: '',
    });
  };

  const resetReminderForm = () => {
    setReminderMessage('');
    setReminderError('');
  };

  const resetRejectForm = () => {
    setRejectReason('');
    setRejectError('');
  };

  const handleChangeTab = (tab: 'LeaderTasks' | 'AssignedTasks') => {
    setActiveTab(tab);
    setSelectedTask(null);
    setSelectedLeaderTask(null);
    setActionMessage(null);
    setDocumentTasksError('');
  };

  const handleSelectAssignedTask = async (task: TaskModel) => {
    setSelectedTask(task);
    setActionMessage(null);
    setDocumentTasksError('');

    try {
      const detail = await managerService.getTaskById(task.id);
      if (detail) {
        setSelectedTask(detail);
      }
    } catch (error) {
      console.error('Failed to load assigned task detail:', error);
    }
  };

  const handleCreateTask = async () => {
    if (activeTab === 'LeaderTasks' && !getTaskDocumentId(selectedLeaderTask)) {
      setAssignError('Hãy chọn một task chỉ đạo có documentId để phân công.');
      return;
    }

    if (activeTab === 'AssignedTasks' && !selectedTask?.documentId) {
      setAssignError('Hãy chọn một task để phân công.');
      return;
    }

    if (!newTask.title?.trim()) {
      setAssignError('Vui lòng nhập tiêu đề nhiệm vụ.');
      return;
    }
    if (!selectedMemberId) {
      setAssignError('Vui lòng chọn một chuyên viên để phân công.');
      return;
    }
    if (newTask.deadline && isNaN(new Date(newTask.deadline).getTime())) {
      setAssignError('Định dạng thời hạn không hợp lệ. Vui lòng chọn ngày giờ.');
      return;
    }

    setIsSubmittingTask(true);
    setAssignError('');

    try {
      const createdTask = await managerService.createTask(
        {
          documentId: String(assignSourceDocumentId),
          memberId: selectedMemberId,
          assignerId: user.id,
          title: newTask.title.trim(),
          description: newTask.description?.trim() || getTaskDescription(assignSourceTask),
          priority: priorityApiMap[(newTask.priority as PriorityFilter) || 'Medium'],
          dueDate: newTask.deadline || undefined,
          status: 'TODO',
        },
        selectedFiles
      );

      if (createdTask) {
        setTeamTasks((prev) => [createdTask, ...prev]);
      }

      setShowAssignModal(false);
      resetAssignForm();
    } catch (error) {
      console.error('Failed to create task', error);
      setAssignError('Không thể tạo nhiệm vụ. Vui lòng thử lại.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleOpenReminder = () => {
    if (!selectedTask) {
      return;
    }

    resetReminderForm();
    setActionMessage(null);
    setShowReminderModal(true);
  };

  const handleOpenRejectModal = () => {
    if (!selectedTask) {
      return;
    }

    resetRejectForm();
    setActionMessage(null);
    setShowRejectModal(true);
  };

  const handleSendReminder = async () => {
    if (!selectedTask) {
      return;
    }

    if (!reminderMessage.trim()) {
      setReminderError('Vui lòng nhập nội dung nhắc tiến độ.');
      return;
    }

    setIsSendingReminder(true);
    setReminderError('');

    try {
      await managerService.sendClericalReminder(selectedTask.id, {
        message: reminderMessage.trim(),
        priority: getAssignedTaskPriority(selectedTask) === 'Critical' ? 'HIGH' : 'NORMAL',
      });

      setShowReminderModal(false);
      resetReminderForm();
    } catch (error) {
      console.error('Failed to send reminder', error);
      setReminderError('Không thể gửi thông báo đôn đốc. Vui lòng thử lại.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleSendPublish = async () => {
    if (!selectedTask) return;

    const documentId = selectedTaskDocumentId;
    if (!documentId) {
      setActionMessage({
        type: 'error',
        text: 'Không tìm thấy documentId để cập nhật trạng thái văn bản.',
      });
      return;
    }

    setIsPublishingDocument(true);
    setActionMessage(null);

    try {
      const success = await managerService.updateDocumentApproved(String(documentId));
      if (!success) {
        throw new Error('Không thể cập nhật trạng thái ban hành.');
      }

      setTeamTasks((prev) => prev.map((task) => {
        if (task.id !== selectedTask.id) {
          return task;
        }

        return {
          ...task,
          status: 'Completed',
          document: task.document ? { ...task.document, status: 'Completed' } : task.document,
        };
      }));
      setSelectedTask((prev) => (prev ? { ...prev, status: 'Completed', document: prev.document ? { ...prev.document, status: 'Completed' } : prev.document } : prev));
      setActionMessage({
        type: 'success',
        text: 'Đã gửi ban hành văn bản thành công.',
      });
    } catch (error) {
      console.error('Failed to publish task', error);
      setActionMessage({
        type: 'error',
        text: 'Không thể gửi ban hành. Vui lòng thử lại.',
      });
    } finally {
      setIsPublishingDocument(false);
    }
  };

  const handleSendRejectPublish = async () => {
    if (!selectedTask) return;

    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setIsRejectingPublish(true);
    setRejectError('');
    setActionMessage(null);

    try {
      const updated = await managerService.updateTask(selectedTask.id, {
        status: 'REJECTED',
        rejectionReason: rejectReason.trim(),
        note: rejectReason.trim(),
      });

      if (!updated) {
        throw new Error('Không thể cập nhật trạng thái từ chối.');
      }

      setTeamTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? { ...task, status: 'Rejected', rejectionReason: rejectReason.trim() } : task)));
      setSelectedTask((prev) => (prev ? { ...prev, status: 'Rejected', rejectionReason: rejectReason.trim() } : prev));
      setShowRejectModal(false);
      resetRejectForm();
      setActionMessage({
        type: 'success',
        text: 'Đã từ chối ban hành văn bản.',
      });
    } catch (error) {
      console.error('Failed to reject publish task', error);
      setRejectError('Không thể từ chối ban hành. Vui lòng thử lại.');
    } finally {
      setIsRejectingPublish(false);
    }
  };




  // Team/member data is intentionally kept empty for now.

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [leaderTasks, assignedTasks] = await Promise.all([
          managerService.getMyTasks(user.id),
          managerService.getAssignedTasks(user.id),
        ]);

        setInboundTasks(leaderTasks);
        setTeamTasks(assignedTasks);
        setSelectedLeaderTask(null);
        setSelectedTask(null);
        // setStats(computeStats(leaderTasks));
      } catch (err) {
        console.error('Failed to load manager dashboard data', err);
        setInboundTasks([]);
        setTeamTasks([]);
        setSelectedLeaderTask(null);
        setSelectedTask(null);
        setMembers([]);
        setStats({
          totalDocs: 0,
          pendingApprovals: 0,
          processingTime: '0 ngày',
          efficiency: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user.id]);


  useEffect(() => {
    const loadMembers = async () => {
      if (!departmentId) {
        setMembers([]);
        return;
      }

      try {
        const depMembers = await departmentMemberService.getMembersByDepartmentId(departmentId);
        setMembers(depMembers);
      } catch (err) {
        console.error('Failed to load department members', err);
        setMembers([]);
      }
    };

    loadMembers();
  }, [departmentId]);

  useEffect(() => {
    const loadDocumentAttachments = async () => {
      const documentId = assignSourceDocumentId;

      if (!showAssignModal || !documentId) {
        setDocumentAttachments([]);
        return;
      }

      try {
        const files = await getDocumentFiles(String(documentId));
        setDocumentAttachments(files || []);
      } catch (err) {
        console.error('Failed to load document attachments', err);
        setDocumentAttachments([]);
      }
    };

    loadDocumentAttachments();
  }, [showAssignModal, assignSourceDocumentId]);

  useEffect(() => {
    const documentId = selectedTaskDocumentId;

    if (!selectedTask || activeTab !== 'AssignedTasks' || selectedTaskProgress < 100 || !documentId) {
      setDocumentTasksError('');
      return;
    }

    if (documentTasksByDocumentId[documentId]) {
      setDocumentTasksError('');
      return;
    }

    let isActive = true;
    setLoadingDocumentTasksForDocumentId(documentId);
    setDocumentTasksError('');

    const loadTasks = async () => {
      try {
        const tasks = await managerService.getTasksByDocumentId(documentId);
        if (!isActive) {
          return;
        }

        setDocumentTasksByDocumentId((prev) => ({
          ...prev,
          [documentId]: tasks,
        }));
      } catch (err) {
        console.error('Failed to load tasks by documentId', err);
        if (isActive) {
          setDocumentTasksError('Không thể tải danh sách task theo văn bản.');
        }
      } finally {
        if (isActive) {
          setLoadingDocumentTasksForDocumentId((current) => (current === documentId ? null : current));
        }
      }
    };

    loadTasks();

    return () => {
      isActive = false;
    };
  }, [activeTab, documentTasksByDocumentId, selectedTaskDocumentId, selectedTask, selectedTaskProgress]);


  const formatDate = (dateText?: string) => {
    if (!dateText) return '';

    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) {
      return dateText;
    }

    return parsed.toLocaleDateString('vi-VN');
  };

  const displayedLeaderTasks = sortedInboundTasks;
  const displayedAssignedTasks = teamTasks;
  const taskCountLabel = activeTab === 'LeaderTasks' ? inboundTasks.length : teamTasks.length;

  const statsCards = useMemo(() => {
    const overdue = activeTab === 'LeaderTasks'
      ? inboundTasks.filter((task) => task.document?.status === 'Done').length
      : teamTasks.filter((task) => getAssignedTaskStatus(task) === 'Overdue').length;

    return {
      overdue,
      efficiency: stats.efficiency,
      totalDocs: stats.totalDocs,
      pendingApprovals: stats.pendingApprovals,
    };
  }, [activeTab, inboundTasks, stats, teamTasks]);


  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            onClick={() => handleChangeTab('LeaderTasks')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'LeaderTasks' ? 'bg-teams-purple text-white shadow-md shadow-teams-purple/20' : 'text-text-secondary hover:bg-gray-100'}`}
          >
            <FileText size={14} />
            <span>Danh sách chỉ đạo</span>
          </button>
          <button
            onClick={() => handleChangeTab('AssignedTasks')}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'AssignedTasks' ? 'bg-teams-purple text-white shadow-md shadow-teams-purple/20' : 'text-text-secondary hover:bg-gray-100'}`}
          >
            <Users size={14} />
            <span>Danh sách phân công</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Task từ Leader" value={inboundTasks.length.toString()} trend="Đang theo dõi" />
        <StatCard title="Task đã phân công" value={teamTasks.length.toString()} trend="Trong phòng ban" />
        <StatCard title="Hiệu suất xử lý" value={`${statsCards.efficiency}%`} color="text-green-600" trend="+0.5%" />
        <StatCard title="Task trễ hạn" value={statsCards.overdue.toString().padStart(2, '0')} color="text-red-600" trend="Cần đôn đốc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-150 items-start">
        <div className={`transition-all duration-500 ${activeTab === 'LeaderTasks' ? (selectedLeaderTask ? 'lg:col-span-5' : 'lg:col-span-8') : (selectedTask ? 'lg:col-span-5' : 'lg:col-span-8')}`}>
          <div className="teams-card h-full flex flex-col">
            <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
                {activeTab === 'LeaderTasks' ? <Send size={16} className="text-teams-purple" /> : <Layout size={16} className="text-teams-purple" />}
                {activeTab === 'LeaderTasks' ? `Danh sách chỉ đạo (${taskCountLabel})` : `Danh sách phân công (${taskCountLabel})`}
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
                {activeTab === 'AssignedTasks' && (
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      resetAssignForm();
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
                <div className="p-12 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : (
                activeTab === 'LeaderTasks' ? (
                  displayedLeaderTasks.length === 0 ? (
                    <div className="p-12 text-center text-xs text-text-secondary">
                      Chưa có task nào Leader giao cho bạn.
                    </div>
                  ) : (
                    displayedLeaderTasks.map((task) => {
                      const priority = getLeaderTaskPriority(task);
                      const status = getLeaderTaskStatus(task);
                      const title = getLeaderTaskTitle(task);
                      const deadline = getLeaderTaskDeadline(task);
                      const assigneeName = getLeaderTaskOwnerName(task);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedLeaderTask(task)}
                          className={`p-4 hover:bg-teams-purple/5 cursor-pointer transition-all border-l-4 ${selectedLeaderTask?.id === task.id
                              ? 'bg-teams-purple/5 border-l-teams-purple'
                              : 'border-l-transparent'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priority === 'Critical'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : priority === 'High'
                                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                              {priorityLabelMap[priority]}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">Hạn: {formatDate(deadline)}</span>
                          </div>
                          <h3 className="text-sm font-bold text-text-main group-hover:text-teams-purple transition-colors line-clamp-1">{title}</h3>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tight truncate">
                                {assigneeName}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'Completed'
                                ? 'bg-green-50 text-green-600'
                                : status === 'Rejected'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-blue-50 text-blue-600'
                              }`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : displayedAssignedTasks.length === 0 ? (
                  <div className="p-12 text-center text-xs text-text-secondary">
                    Chưa có task nào bạn đã giao cho nhân viên.
                  </div>
                ) : (
                  displayedAssignedTasks.map((task) => {
                    const priority = getAssignedTaskPriority(task);
                    const status = getAssignedTaskStatus(task);

                    return (
                    <div
                      key={task.id}
                      onClick={() => handleSelectAssignedTask(task)}
                      className={`p-4 hover:bg-teams-purple/5 cursor-pointer transition-all border-l-4 ${selectedTask?.id === task.id
                          ? 'bg-teams-purple/5 border-l-teams-purple'
                          : task.memberId
                            ? 'border-l-transparent'
                            : 'border-l-teams-purple bg-teams-purple/5 shadow-sm'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priority === 'Critical'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : priority === 'High'
                              ? 'bg-orange-50 text-orange-600 border-orange-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                          {priorityLabelMap[priority]}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Hạn: {formatDate(getAssignedTaskDeadline(task))}</span>
                      </div>
                      <h3 className="text-sm font-bold text-text-main group-hover:text-teams-purple transition-colors line-clamp-1">{getAssignedTaskTitle(task)}</h3>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-text-secondary">
                          <span>Tiến độ</span>
                          <span>{Math.max(0, Math.min(task.progress ?? 0, 100))}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teams-purple transition-all"
                            style={{ width: `${Math.max(0, Math.min(task.progress ?? 0, 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                            <span className="text-[10px] text-text-secondary font-medium italic">
                              {getAssignedTaskOwnerName(task) || members.find((m) => m.id === task.memberId)?.user?.fullName || 'Chưa gán'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'Completed'
                            ? 'bg-green-50 text-green-600'
                            : status === 'Overdue'
                              ? 'bg-red-50 text-red-600 animate-pulse'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 overflow-hidden self-start ${activeTab === 'LeaderTasks' ? (selectedLeaderTask ? 'lg:col-span-7' : 'lg:col-span-4') : (selectedTask ? 'lg:col-span-7' : 'lg:col-span-4')}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'LeaderTasks' ? (
              selectedLeaderTask ? (
                <motion.div
                  key="leader-task-detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="teams-card flex flex-col h-full overflow-hidden lg:sticky lg:top-6"
                >
                  <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-teams-purple/10 flex items-center justify-center rounded-lg shadow-sm border border-teams-purple/20">
                        <Send size={18} className="text-teams-purple" />
                      </div>
                      <div>
                        <h2 className="font-bold text-xs text-text-main line-clamp-1">{getLeaderTaskTitle(selectedLeaderTask)}</h2>
                        <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{selectedLeaderTask.id}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedLeaderTask(null)} className="text-gray-400 hover:text-text-main p-1">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Bot size={72} />
                      </div>
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-indigo-600 animate-pulse" />
                          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Chỉ đạo từ Leader</span>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                        {selectedLeaderTask.document?.description || selectedLeaderTask.note || 'Chưa có nội dung mô tả chi tiết.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-teams-border">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phòng ban</div>
                        <div className="text-sm font-bold text-text-main">{getLeaderTaskDepartmentName(selectedLeaderTask)}</div>
                        <div className="text-[11px] text-text-secondary mt-1">{selectedLeaderTask.department?.managerName || 'Chưa có người quản lý'}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-teams-border">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Mã văn bản</div>
                        <div className="text-sm font-bold text-text-main">{selectedLeaderTask.document?.documentNumber || selectedLeaderTask.id}</div>
                        <div className="text-[11px] text-text-secondary mt-1">{getLeaderTaskStatus(selectedLeaderTask)}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-teams-border">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Độ ưu tiên</div>
                        <div className="text-sm font-bold text-text-main">{priorityLabelMap[getLeaderTaskPriority(selectedLeaderTask)]}</div>
                        <div className="text-[11px] text-text-secondary mt-1">{selectedLeaderTask.document?.priority || selectedLeaderTask.document?.urgency || 'Low'}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-teams-border">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hạn xử lý</div>
                        <div className="text-sm font-bold text-text-main">{formatDate(getLeaderTaskDeadline(selectedLeaderTask))}</div>
                        <div className="text-[11px] text-text-secondary mt-1">{selectedLeaderTask.document?.status || 'Pending'}</div>
                      </div>
                    </div>

                    {getLeaderTaskFiles(selectedLeaderTask).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tệp đính kèm</h4>
                        <div className="grid gap-2">
                          {getLeaderTaskFiles(selectedLeaderTask).map((file) => (
                            <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-teams-border bg-white px-3 py-2">
                              <span className="text-xs font-medium text-text-main truncate">{file.file_name}</span>
                              <FileText size={14} className="text-teams-purple" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {getLeaderTaskHistory(selectedLeaderTask).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lịch sử chỉ đạo</h4>
                        <div className="space-y-2">
                          {getLeaderTaskHistory(selectedLeaderTask).map((item) => (
                            <div key={item.id} className="rounded-lg border border-teams-border bg-white px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-text-main">{item.status}</span>
                                <span className="text-[10px] text-text-secondary">{formatDate(item.createdAt as string)}</span>
                              </div>
                              <p className="text-[11px] text-text-secondary mt-1">{item.action || item.note || 'Không có ghi chú'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-teams-border flex gap-2 bg-white sticky bottom-0">
                    <button
                      onClick={() => {
                        if (!departmentId) return;
                        resetAssignForm();
                        setShowAssignModal(true);
                      }}
                      disabled={!departmentId}
                      className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Send size={16} />
                      Phân công xử lý
                    </button>
                    <button className="w-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-center justify-center p-0 text-text-secondary">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="leader-roster"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="teams-card p-5 h-full space-y-6 lg:sticky lg:top-6"
                >
                  <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-tight mb-1">Danh sách chỉ đạo</h3>
                    <p className="text-[10px] text-text-secondary font-medium">Chọn một task để xem chi tiết chỉ đạo</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-600" />
                      <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Chưa chọn task</span>
                    </div>
                    <p className="text-[11px] text-orange-900/70 leading-relaxed font-medium">
                      Hãy chọn một task trong danh sách chỉ đạo để xem nội dung, tệp đính kèm và lịch sử xử lý.
                    </p>
                  </div>
                </motion.div>
              )
            ) : selectedTask ? (
              <motion.div
                key="task-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="teams-card flex flex-col h-full overflow-hidden lg:sticky lg:top-6"
              >
                <div className="p-4 border-b border-teams-border bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teams-purple/10 flex items-center justify-center rounded-lg shadow-sm border border-teams-purple/20">
                      <FileText size={18} className="text-teams-purple" />
                    </div>
                    <div>
                      <h2 className="font-bold text-xs text-text-main line-clamp-1">{getAssignedTaskTitle(selectedTask)}</h2>
                      <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{selectedTask.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-text-main p-1">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                  <div className="p-4 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Bot size={72} />
                    </div>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-600 animate-pulse" />
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

                  {actionMessage && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-xs font-semibold ${actionMessage.type === 'success'
                          ? 'border-green-100 bg-green-50 text-green-700'
                          : 'border-red-100 bg-red-50 text-red-700'
                        }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung task</h4>
                    <p className="text-xs text-text-main leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedTask.description || selectedTask.document?.description || selectedTask.note || 'Chưa có nội dung mô tả chi tiết.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-teams-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Người giao</div>
                      <div className="text-sm font-bold text-text-main">{selectedTask.assigner?.fullName || selectedTask.assignerName || selectedTask.sender || 'Chưa rõ'}</div>
                      <div className="text-[11px] text-text-secondary mt-1">{selectedTask.assigner?.email || selectedTask.assignerEmail || 'Không có email'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-teams-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Người xử lý</div>
                      <div className="text-sm font-bold text-text-main">{selectedTask.member?.user?.fullName || selectedTask.assignee?.fullName || selectedTask.assigneeName || 'Chưa phân công'}</div>
                      <div className="text-[11px] text-text-secondary mt-1">
                        {selectedTask.member?.user?.email || selectedTask.assignee?.email || selectedTask.assigneeEmail || (selectedTask.memberId ? 'Đã phân công' : 'Chưa có người xử lý')}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-teams-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Mã văn bản</div>
                      <div className="text-sm font-bold text-text-main">{getAssignedTaskDocumentNumber(selectedTask)}</div>
                      <div className="text-[11px] text-text-secondary mt-1">{getAssignedTaskDepartmentName(selectedTask)}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-teams-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hạn xử lý</div>
                      <div className="text-sm font-bold text-text-main">{formatDate(getAssignedTaskDeadline(selectedTask))}</div>
                      <div className="text-[11px] text-text-secondary mt-1">{getAssignedTaskStatus(selectedTask)}</div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-teams-purple/10 bg-teams-purple/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-teams-purple">Tiến trình báo cáo nhanh của clerical</h4>
                        <p className="text-[11px] text-text-secondary mt-1 font-medium">
                          Theo dõi mức hoàn thành của task trước khi ban hành văn bản.
                        </p>
                      </div>
                      <span className="text-sm font-black text-teams-purple">
                        {selectedTaskProgress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white overflow-hidden border border-teams-purple/10">
                      <div
                        className="h-full rounded-full bg-teams-purple transition-all"
                        style={{ width: `${selectedTaskProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                      <span>Trạng thái hiện tại</span>
                      <span>{selectedTaskStatus}</span>
                    </div>
                  </div>

                  {activeTab === 'AssignedTasks' && selectedTaskProgress >= 100 && selectedTaskDocumentId && (
                    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Task theo văn bản</h4>
                          <p className="text-[11px] text-emerald-900/70 mt-1 font-medium">
                            Hệ thống tự tải danh sách task liên quan tới documentId này để tiện theo dõi và kiểm tra file đính kèm.
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-black text-emerald-700 border border-emerald-100">
                          {selectedTaskDocumentTasks.length} task
                        </span>
                      </div>

                      {isLoadingSelectedDocumentTasks ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-5 text-xs font-medium text-text-secondary">
                          <Loader2 size={14} className="animate-spin" />
                          Đang tải danh sách task theo văn bản...
                        </div>
                      ) : documentTasksError ? (
                        <div className="rounded-xl border border-red-100 bg-white px-4 py-3 text-xs font-medium text-red-700">
                          {documentTasksError}
                        </div>
                      ) : selectedTaskDocumentTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-5 text-center text-xs font-medium text-text-secondary">
                          Chưa có task nào được gắn với văn bản này.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedTaskDocumentTasks.map((task) => (
                            <div key={task.id} className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-text-main truncate">
                                    {task.title || task.document?.title || task.documentNumber || task.id}
                                  </div>
                                  <p className="mt-1 text-[11px] text-text-secondary line-clamp-2">
                                    {task.description || task.note || task.document?.description || 'Không có mô tả chi tiết.'}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getAssignedTaskStatus(task) === 'Completed'
                                    ? 'bg-green-50 text-green-600'
                                    : getAssignedTaskStatus(task) === 'Overdue'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                  {getAssignedTaskStatus(task)}
                                </span>
                              </div>

                              {getAssignedTaskFiles(task).length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    File đính kèm
                                  </div>
                                  <div className="space-y-2">
                                    {getAssignedTaskFiles(task).map((file) => (
                                      <a
                                        key={file.id}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100"
                                      >
                                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-main">
                                          {file.nameFile}
                                        </span>
                                        <FileText size={12} className="shrink-0 text-teams-purple" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {!task.files?.length && task.attachments?.length ? (
                                <div className="mt-3 space-y-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    File đính kèm
                                  </div>
                                  <div className="space-y-2">
                                    {task.attachments.map((file, index) => (
                                      <div key={`${task.id}-${file}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] font-medium text-text-main">
                                        {file}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {getAssignedTaskFiles(selectedTask).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tệp đính kèm phân công</h4>
                      <div className="grid gap-2">
                        {getAssignedTaskFiles(selectedTask).map((file) => (
                          <div key={file.id} className="flex items-center justify-between rounded-lg border border-teams-border bg-white px-3 py-2">
                            <span className="text-xs font-medium text-text-main truncate">{file.nameFile}</span>
                            <span className="text-[10px] text-text-secondary">{file.createdAt ? formatDate(file.createdAt) : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getAssignedTaskHistory(selectedTask).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lịch sử xử lý</h4>
                      <div className="space-y-2">
                        {getAssignedTaskHistory(selectedTask).map((item) => (
                          <div key={item.id} className="rounded-lg border border-teams-border bg-white px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-text-main">{item.action || item.status}</span>
                              <span className="text-[10px] text-text-secondary">
                                {typeof item.createdAt === 'string'
                                  ? formatDate(item.createdAt)
                                  : typeof item.processedAt === 'string'
                                    ? formatDate(item.processedAt)
                                    : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary mt-1">{item.note || 'Không có ghi chú'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tệp đính kèm ({selectedTask.attachments.length})</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedTask.attachments.map((file, index) => (
                          <div key={`${file}-${index}`} className="flex items-center p-2 border border-teams-border rounded-md hover:bg-gray-50 transition-colors cursor-pointer group">
                            <FileText size={14} className="text-teams-purple mr-2" />
                            <span className="text-[11px] font-medium text-text-secondary flex-1 truncate">{file}</span>
                            <Plus size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                <div className="p-5 border-t border-teams-border flex gap-2 bg-white sticky bottom-0">
                  {activeTab === 'AssignedTasks' && canPublishAssignedTask ? (
                    <>
                      <button
                        onClick={handleSendPublish}
                        disabled={isPublishingDocument || isRejectingPublish || selectedTaskStatus === 'Completed'}
                        className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isPublishingDocument ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {isPublishingDocument ? 'Đang ban hành...' : selectedTaskStatus === 'Completed' ? 'Đã ban hành' : 'Gửi Ban hành'}
                      </button>
                      <button
                        onClick={handleOpenRejectModal}
                        disabled={isPublishingDocument || isRejectingPublish || selectedTaskStatus === 'Completed'}
                        className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={16} />
                        Từ chối
                      </button>
                    </>
                  ) : shouldShowReminderAction ? (
                    <button
                      onClick={handleOpenReminder}
                      className="flex-1 bg-white border-2 border-teams-purple text-teams-purple py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all hover:bg-teams-purple hover:text-white"
                    >
                      <MessageCircle size={16} />
                      Đôn đốc tiến độ
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!departmentId) return;
                        resetAssignForm();
                        setShowAssignModal(true);
                      }}
                      disabled={!departmentId}
                      className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-teams-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Send size={16} />
                      Phân công xử lý
                    </button>
                  )}
                  <button className="w-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-center justify-center p-0 text-text-secondary">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="team-roster"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="teams-card p-5 h-full space-y-6 lg:sticky lg:top-6"
              >
                <div>
                  <h3 className="text-sm font-black text-text-main uppercase tracking-tight mb-1">Hiệu suất Đội ngũ</h3>
                  <p className="text-[10px] text-text-secondary font-medium">Thống kê khối lượng việc của từng chuyên viên</p>
                </div>

                {members.length === 0 ? (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-600" />
                      <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Chưa có dữ liệu phòng ban</span>
                    </div>
                    <p className="text-[11px] text-orange-900/70 leading-relaxed font-medium">
                      Hệ thống chưa lấy được departmentId từ task cấp trên nên chưa hiển thị được members và task của phòng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-teams-purple/30 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-teams-purple text-teams-purple flex items-center justify-center font-black shadow-sm">
                            {member.user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-text-main truncate group-hover:text-teams-purple transition-all">{member.user.fullName}</p>
                            <p className="text-[9px] text-text-secondary font-medium italic">{member.user.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] text-gray-400 uppercase font-black tracking-tighter">Done</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-orange-600" />
                    <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Team Performance Tip</span>
                  </div>
                  <p className="text-[11px] text-orange-900/70 leading-relaxed font-medium">
                    "Hãy ưu tiên các task đang trễ hạn để giữ nhịp cho toàn phòng."
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                <button onClick={() => { setShowAssignModal(false); resetAssignForm(); }} className="text-gray-400 hover:text-text-main">
                  <X size={24} />
                </button>
              </div>

              {assignSourceTask && (
                <div className="p-3 bg-teams-purple/5 border border-teams-purple/10 rounded-lg">
                  <p className="text-[9px] font-black text-teams-purple uppercase tracking-wider mb-1">Dựa trên chỉ đạo</p>
                  <p className="text-xs font-bold text-text-main line-clamp-1 italic">"{getTaskTitle(assignSourceTask)}"</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tiêu đề nhiệm vụ chi tiết</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none font-bold text-sm transition-all"
                    placeholder="VD: Rà soát log hệ thống server..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</label>
                  <textarea
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full min-h-28 p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none font-medium text-sm transition-all resize-none"
                    placeholder="Mô tả yêu cầu, phạm vi công việc, lưu ý xử lý..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chọn Chuyên viên</label>
                    <select
                      className="w-full p-3 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none text-sm font-bold bg-white"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                    >
                      <option value="">-- Chọn thành viên --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.user.fullName} ({m.user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời hạn (ngày giờ)</label>
                    <input
                      type="datetime-local"
                      step="1"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                {documentAttachments && documentAttachments.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tệp liên quan (Document)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                      {documentAttachments.map((att) => (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center p-2 border border-teams-border rounded-md hover:bg-gray-50 transition-colors">
                          <FileText size={14} className="text-teams-purple mr-2" />
                          <span className="text-[11px] font-medium text-text-secondary truncate">{att.file_name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Đính kèm tài liệu</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl outline-none text-sm"
                  />
                  <p className="text-[10px] text-text-secondary font-medium">Có thể chọn nhiều tài liệu cùng lúc.</p>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 max-h-28 overflow-y-auto custom-scrollbar">
                      {selectedFiles.map((file) => (
                        <div key={`${file.name}-${file.size}`} className="text-[11px] px-3 py-2 bg-teams-purple/5 border border-teams-purple/10 rounded-lg text-text-main truncate">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Độ ưu tiên</label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setNewTask({ ...newTask, priority })}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg border-2 transition-all ${newTask.priority === priority
                          ? 'bg-teams-purple text-white border-teams-purple shadow-md'
                          : 'bg-white text-text-secondary border-gray-100 hover:bg-gray-50'
                          }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                {assignError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[11px] font-medium">
                    {assignError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowAssignModal(false); resetAssignForm(); }}
                  className="flex-1 py-3 text-sm font-black text-text-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={isSubmittingTask || !assignSourceDocumentId}
                  className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-teams-purple/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <ArrowRight size={18} />
                  {isSubmittingTask ? 'Đang tạo...' : 'Xác nhận Phân việc'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRejectModal(false);
                resetRejectForm();
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-60 space-y-5"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-black text-text-main">Từ chối ban hành</h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Nhập lý do trước khi gửi</p>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    resetRejectForm();
                  }}
                  className="text-gray-400 hover:text-text-main"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-wider mb-1">Task cần từ chối</p>
                <p className="text-xs font-bold text-text-main line-clamp-1 italic">{getAssignedTaskTitle(selectedTask)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lý do từ chối</label>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="w-full min-h-32 p-3 bg-gray-50 border-2 border-transparent focus:border-red-300 rounded-xl outline-none font-medium text-sm transition-all resize-none"
                  placeholder="Nhập lý do vì sao chưa thể ban hành..."
                />
              </div>

              {rejectError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[11px] font-medium">
                  {rejectError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    resetRejectForm();
                  }}
                  className="flex-1 py-3 text-sm font-black text-text-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendRejectPublish}
                  disabled={isSendingReminder || !rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                  {isSendingReminder ? 'Đang gửi...' : 'Gửi từ chối'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReminderModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowReminderModal(false);
                resetReminderForm();
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative z-60 space-y-5"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-black text-text-main">Đôn đốc tiến độ</h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Gửi nhắc việc</p>
                </div>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    resetReminderForm();
                  }}
                  className="text-gray-400 hover:text-text-main"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-3 bg-teams-purple/5 border border-teams-purple/10 rounded-lg">
                <p className="text-[9px] font-black text-teams-purple uppercase tracking-wider mb-1">Nhắc cho task</p>
                <p className="text-xs font-bold text-text-main line-clamp-1 italic">{selectedTask.title}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Nội dung thông báo</label>
                <textarea
                  value={reminderMessage}
                  onChange={(event) => setReminderMessage(event.target.value)}
                  className="w-full min-h-32 p-3 bg-gray-50 border-2 border-transparent focus:border-teams-purple rounded-xl outline-none font-medium text-sm transition-all resize-none"
                  placeholder="Nhập nội dung nhắc tiến độ cho ClericalDashboard..."
                />
              </div>

              {reminderError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[11px] font-medium">
                  {reminderError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    resetReminderForm();
                  }}
                  className="flex-1 py-3 text-sm font-black text-text-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="flex-1 bg-teams-purple text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-teams-purple/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                  {isSendingReminder ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
