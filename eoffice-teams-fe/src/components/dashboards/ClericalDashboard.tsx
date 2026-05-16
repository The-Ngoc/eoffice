import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Upload,
  Search,
  CheckCircle,
  MessageCircle,
  Send,
  Bot,
  X,
  Plus,
  History,
  FilePlus,
  MoreVertical,
  Zap,
  AlertTriangle,
  Eye,
  DownloadCloud,
} from 'lucide-react';

import { User } from '../../models/user';
import {
  ClericalDocument,
  ClericalDocumentStatus,
  ClericalFlowStepStatus,
  ClericalUrgency,
  CreateDocumentPayload,
} from '../../models/clerical';
import {
  createDocument,
  deleteDocument,
  getAllDocuments,
  getDocumentById,
  submitDocumentToLeader,
  updateStatus,
} from '../../service/clericalService';
import VerificationCode from '../common/VerificationCode';
import { StatCard } from '../common/SharedComponents';

export const ClericalDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [documents, setDocuments] = useState<ClericalDocument[]>([]);
  const [activeTab, setActiveTab] = useState<ClericalDocumentStatus | 'All'>('All');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLegalAlertAcknowledged, setIsLegalAlertAcknowledged] = useState(false);

  const [newDocForm, setNewDocForm] = useState<CreateDocumentPayload>({
    docNumber: '',
    symbol: '',
    title: '',
    sender: '',
    status: 'INITIALIZED',
    urgency: 'Thường',
    arrivalDate: new Date().toISOString(),
    type: 'Công văn',
    isOverdue: false,
  });

  const fetchDocuments = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await getAllDocuments();
      const docs = response.data ?? [];
      setDocuments(docs);

      if (docs.length > 0) {
        setSelectedDocId((current) => current ?? docs[0].id);
      } else {
        setSelectedDocId(null);
      }
    } catch (error) {
      setErrorMessage('Không thể tải danh sách văn bản. Vui lòng thử lại.');
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return documents.filter((doc) => {
      const byStatus = activeTab === 'All' || doc.status === activeTab;
      const bySearch =
        normalizedSearch.length === 0 ||
        doc.docNumber.toLowerCase().includes(normalizedSearch) ||
        doc.symbol.toLowerCase().includes(normalizedSearch) ||
        doc.title.toLowerCase().includes(normalizedSearch);

      return byStatus && bySearch;
    });
  }, [documents, activeTab, searchTerm]);

  const selectedDoc = useMemo(() => {
    if (!selectedDocId) {
      return null;
    }

    return documents.find((doc) => doc.id === selectedDocId) ?? null;
  }, [documents, selectedDocId]);

  const pendingCount = useMemo(
    () => documents.filter((doc) => doc.status === 'INITIALIZED').length,
    [documents],
  );

  const processingCount = useMemo(
    () => documents.filter((doc) => doc.status === 'PROCESSING').length,
    [documents],
  );

  const urgentCount = useMemo(() => documents.filter((doc) => doc.urgency === 'Hỏa tốc').length, [documents]);

  const waitingPublishCount = useMemo(
    () => documents.filter((doc) => doc.status === 'WAITING_PUBLISH').length,
    [documents],
  );

  const publishedCount = useMemo(() => documents.filter((doc) => doc.status === 'PUBLISHED').length, [documents]);

  const displayFlow = useMemo(() => {
    if (!selectedDoc) {
      return [];
    }

    return selectedDoc.flow.map((step, index) => {
      const isLastStep = index === selectedDoc.flow.length - 1;
      const normalizedStatus = step.status || (isLastStep ? 'Current' : 'Done');

      return {
        ...step,
        status: normalizedStatus as ClericalFlowStepStatus,
      };
    });
  }, [selectedDoc]);

  // Publish / verification state
  const [showPublishVerification, setShowPublishVerification] = useState(false);
  const [isPublishVerified, setIsPublishVerified] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSelectDocument = async (id: string) => {
    setSelectedDocId(id);
    setIsDetailLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await getDocumentById(id);
      const detail = response.data;

      setDocuments((currentDocs) =>
        currentDocs.map((doc) => (doc.id === detail.id ? detail : doc)),
      );
    } catch (error) {
      setErrorMessage('Không thể tải chi tiết văn bản. Vui lòng thử lại.');
      console.error('Failed to fetch document detail:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocForm.docNumber || !newDocForm.symbol || !newDocForm.title || !newDocForm.sender) {
      setErrorMessage('Vui lòng nhập đầy đủ Số hiệu, Ký hiệu, Trích yếu và Đơn vị gửi.');
      return;
    }

    if (!isLegalAlertAcknowledged) {
      setErrorMessage('Vui lòng xác nhận cảnh báo tính pháp lý trước khi tiếp nhận văn bản.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await createDocument(newDocForm, selectedFiles);
      const created = response.data;

      setDocuments((currentDocs) => [created, ...currentDocs]);
      setSelectedDocId(created.id);
      setIsUploadModalOpen(false);
      setSelectedFiles([]);
      setIsLegalAlertAcknowledged(false);
      setNewDocForm({
        docNumber: '',
        symbol: '',
        title: '',
        sender: '',
        status: 'INITIALIZED',
        urgency: 'Thường',
        arrivalDate: new Date().toISOString(),
        type: 'Công văn',
        isOverdue: false,
      });
    } catch (error) {
      setErrorMessage('Không thể tạo mới văn bản. Vui lòng thử lại.');
      console.error('Failed to create document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedDoc) {
      return;
    }

    const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa văn bản này không?');
    if (!isConfirmed) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteDocument(selectedDoc.id);

      setDocuments((currentDocs) => {
        const nextDocs = currentDocs.filter((doc) => doc.id !== selectedDoc.id);
        setSelectedDocId(nextDocs.length > 0 ? nextDocs[0].id : null);
        return nextDocs;
      });
    } catch (error) {
      setErrorMessage('Không thể xóa văn bản. Vui lòng thử lại.');
      console.error('Failed to delete document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitToLeader = async () => {
    if (!selectedDoc) {
      return;
    }

    if (selectedDoc.status !== 'INITIALIZED' && selectedDoc.status !== 'REJECTED') {
      return;
    }

    // if (selectedDoc.status === 'WAITING_LEADER') {
    //   setErrorMessage('Văn bản đang chờ Lãnh đạo duyệt, không thể trình lặp lại.');
    //   return;
    // }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await submitDocumentToLeader(selectedDoc.id);
      const submitted = response.data;

      setDocuments((currentDocs) =>
        currentDocs.map((doc) => (doc.id === submitted.id ? submitted : doc)),
      );
      setSelectedDocId(submitted.id);
      setSuccessMessage('Văn bản đã được trình lên Lãnh đạo và đang chờ duyệt.');
    } catch (error) {
      setErrorMessage('Không thể trình văn bản lên Lãnh đạo. Vui lòng thử lại.');
      console.error('Failed to submit document to leader:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish flow handlers
  const handleStartPublishFlow = () => {
    setShowPublishVerification(true);
    setIsPublishVerified(false);
    setErrorMessage(null);
  };

  const handleVerificationSuccess = () => {
    setIsPublishVerified(true);
    setErrorMessage(null);
  };

  const handlePublishCancel = () => {
    setShowPublishVerification(false);
    setIsPublishVerified(false);
  };

  const handlePublishConfirm = async () => {
    if (!selectedDoc) return;
    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateStatus(selectedDoc.id, 'PUBLISHED' as ClericalDocumentStatus);
      const updated = response.data;

      setDocuments((currentDocs) => currentDocs.map((d) => (d.id === updated.id ? updated : d)));
      setSelectedDocId(updated.id);
      setSuccessMessage('Văn bản đã được ban hành.');
      setShowPublishVerification(false);
      setIsPublishVerified(false);
    } catch (error) {
      setErrorMessage('Không thể ban hành văn bản. Vui lòng thử lại.');
      console.error('Failed to publish document:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = Array.from(event.target.files ?? []);

    if (pickedFiles.length === 0) {
      return;
    }

    setSelectedFiles((currentFiles) => {
      const mergedFiles = [...currentFiles, ...pickedFiles];

      return mergedFiles.filter(
        (file, index, array) =>
          index ===
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified,
          ),
      );
    });

    event.target.value = '';
  };

  const removeSelectedFile = (targetFile: File) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          !(
            file.name === targetFile.name &&
            file.size === targetFile.size &&
            file.lastModified === targetFile.lastModified
          ),
      ),
    );
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const isWaitingLeader =
    selectedDoc?.status === 'WAITING_LEADER' ||
    Boolean(
      selectedDoc?.flow.some(
        (step) =>
          step.status === 'Current' &&
          step.action.toLowerCase().includes('lãnh đạo'),
      ),
    );

  const isProcessing = selectedDoc?.status === 'PROCESSING';
  const canSubmitToLeader = selectedDoc?.status === 'INITIALIZED' || selectedDoc?.status === 'REJECTED';
  const selectedFileCount = selectedFiles.length;

  const canPublish = selectedDoc?.status === 'WAITING_PUBLISH';

  return (
    <div className="max-w-400 mx-auto space-y-6">
      {errorMessage && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchDocuments}
            className="text-xs font-semibold px-2 py-1 rounded border border-red-200 hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {successMessage && (
        <div className="border border-green-200 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Chờ tiếp nhận" value={pendingCount.toString().padStart(2, '0')} color="text-teams-purple" />
        <StatCard title="Đang xử lý" value={processingCount.toString().padStart(2, '0')} color="text-blue-600" />
        <StatCard title="Văn bản hỏa tốc" value={urgentCount.toString().padStart(2, '0')} color="text-red-600" />
        <StatCard title="Chờ ban hành" value={waitingPublishCount.toString().padStart(2, '0')} color="text-green-600" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
        {/* Left Side: Document List */}
        <div className="lg:w-2/3 flex flex-col bg-white rounded-lg border border-teams-border overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-teams-border flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
            <div className="flex bg-white rounded-md border border-teams-border p-0.5">
              {(
                ['All', 'INITIALIZED', 'WAITING_LEADER', 'REJECTED', 'PROCESSING', 'WAITING_PUBLISH', 'PUBLISHED'] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${
                    activeTab === tab
                      ? 'bg-teams-purple text-white shadow-sm'
                      : 'text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  {
                    ({
                      All: 'Tất cả',
                      INITIALIZED: 'Khởi tạo',
                      WAITING_LEADER: 'Chờ lãnh đạo duyệt',
                      REJECTED: 'Bị từ chối',
                      PROCESSING: 'Đang xử lý',
                      WAITING_PUBLISH: 'Chờ ban hành',
                      PUBLISHED: 'Đã ban hành',
                    } as Record<string, string>)[tab]
                  }
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm mã số, tiêu đề..."
                  className="pl-9 pr-4 py-1.5 bg-white border border-teams-border rounded text-xs outline-none focus:border-teams-purple w-48"
                />
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-4 py-1.5 shadow-sm"
              >
                <Upload size={16} />
                <span>Tiếp nhận mới</span>
              </button>
            </div>
          </div>

          {/* List/Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-sm text-text-secondary">Đang tải danh sách văn bản...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-teams-border sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-bold text-text-secondary uppercase">Mã số - Ký hiệu</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-text-secondary uppercase">Trích yếu</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-text-secondary uppercase">Độ khẩn</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-text-secondary uppercase">Ngày đến</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-text-secondary uppercase">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teams-border">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc.id)}
                      className={`cursor-pointer transition-all ${
                        selectedDocId === doc.id ? 'bg-teams-purple/5 border-l-4 border-l-teams-purple' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-text-main text-sm">{doc.docNumber}</div>
                        <div className="text-[10px] text-text-secondary font-medium tracking-wide">{doc.symbol}</div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-text-main line-clamp-1 group-hover:text-teams-purple">{doc.title}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{doc.sender}</p>
                      </td>
                      <td className="px-5 py-4">
                        <UrgencyTag urgency={doc.urgency} isOverdue={doc.isOverdue && doc.status === 'INITIALIZED'} />
                      </td>
                      <td className="px-5 py-4 text-xs text-text-secondary font-medium">{formatDateTime(doc.arrivalDate)}</td>
                      <td className="px-5 py-4">
                        <StatusChip status={doc.status} />
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-text-secondary">
                        Không có văn bản phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Detail Panel */}
        <div className="lg:w-1/3 flex flex-col bg-white rounded-lg border border-teams-border shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedDoc ? (
              <motion.div
                key={selectedDoc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full"
              >
                {/* Panel Header */}
                <div className="p-5 border-b border-teams-border bg-gray-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teams-purple/10 flex items-center justify-center rounded-lg">
                      <FileText className="text-teams-purple" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-main">Chi tiết văn bản</h3>
                      <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">
                        {selectedDoc.docNumber}/{selectedDoc.symbol}
                      </p>
                    </div>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    onClick={handleDeleteSelected}
                    title="Xóa văn bản"
                    disabled={isSaving}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                  {isDetailLoading && <p className="text-xs text-text-secondary">Đang tải chi tiết...</p>}

                  {/* AI Section */}
                  <div className="p-4 bg-teams-purple/5 rounded-lg border border-teams-purple/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bot size={16} className="text-[#A18CD1]" />
                        <span className="text-[11px] font-bold text-[#A18CD1] uppercase tracking-wider">AI Copilot Analysis</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsAiSummarizing(true);
                          setTimeout(() => setIsAiSummarizing(false), 1500);
                        }}
                        disabled={isAiSummarizing}
                        className="bg-white px-2 py-1 border border-teams-border rounded text-[10px] font-bold text-text-main hover:bg-gray-50 flex items-center gap-1 transition-all"
                      >
                        {isAiSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt ngay'}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed italic">
                      {isAiSummarizing
                        ? ''
                        : `Văn bản thuộc loại "${selectedDoc.type}", nội dung chính: ${selectedDoc.title}.`}
                    </p>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <History size={14} />
                      Lịch sử xử lý
                    </h4>
                    <div className="space-y-6 relative ml-3">
                      <div className="absolute -left-3.25 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                      {displayFlow.map((step) => (
                        <div key={step.id} className="relative flex flex-col pl-4">
                          <FlowStepDot status={step.status} />
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-main">{step.action}</span>
                            <span className="text-[10px] text-gray-400">{step.time}</span>
                          </div>
                            <span className="text-[11px] text-text-secondary mt-1">{step.user}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{step.status === 'Current' ? 'Đang thực hiện' : step.status === 'Done' ? 'Đã hoàn tất' : 'Chờ xử lý'}</span>
                        </div>
                      ))}
                      {displayFlow.length === 0 && (
                        <p className="text-xs text-text-secondary">Chưa có lịch sử xử lý.</p>
                      )}
                    </div>
                  </div>

                  {/* Attachments list (mock data for now) */}
                  <div className="pt-4">
                    <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={14} /> Đính kèm
                    </h4>
                    <div className="space-y-2">
                      {(selectedDoc ? [
                        // If backend later provides attachments as URLs, use them. For now use mock samples.
                        { name: 'Công văn - Mẫu.pdf', url: '#', type: 'pdf' },
                        { name: 'Báo cáo.xlsx', url: '#', type: 'xlsx' },
                        { name: 'Ảnh minh họa.jpg', url: '#', type: 'jpg' },
                      ] : []).map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-teams-border bg-white px-3 py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-teams-purple/10 flex items-center justify-center text-teams-purple shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text-main truncate">{file.name}</p>
                              <p className="text-[10px] text-text-secondary">{file.type?.toUpperCase() ?? 'FILE'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="text-gray-500 hover:text-teams-purple flex items-center gap-2 text-xs">
                              <Eye size={14} /> Xem
                            </button>
                            <a href={file.url} className="text-gray-500 hover:text-teams-purple flex items-center gap-2 text-xs" download>
                              <DownloadCloud size={14} /> Tải
                            </a>
                          </div>
                        </div>
                      ))}
                      {selectedDoc == null && <p className="text-xs text-text-secondary">Không có tệp đính kèm.</p>}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-5 border-t border-teams-border bg-gray-50/30 flex flex-col gap-3">
                  {canPublish ? (
                    <div className="space-y-3">
                      {!showPublishVerification && (
                        <button
                          className="w-full bg-teams-purple text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-teams-purple/90 transition-all"
                          onClick={handleStartPublishFlow}
                          disabled={isPublishing}
                        >
                          <Send size={14} /> Ký ban hành
                        </button>
                      )}

                      {showPublishVerification && (
                        <div className="bg-white p-3 rounded border border-teams-border">
                          <VerificationCode
                            expectedCode="123456"
                            onSuccess={handleVerificationSuccess}
                            onCancel={handlePublishCancel}
                          />

                          {isPublishVerified && (
                            <div className="mt-3 flex gap-2">
                              <button
                                className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold"
                                onClick={handlePublishConfirm}
                                disabled={isPublishing}
                              >
                                {isPublishing ? 'Đang ban hành...' : 'Ban hành'}
                              </button>
                              <button
                                className="px-4 py-2 text-sm font-bold text-text-secondary border rounded"
                                onClick={handlePublishCancel}
                                disabled={isPublishing}
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="flex-1 bg-teams-purple text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-teams-purple/90 transition-all"
                        onClick={isProcessing ? undefined : handleSubmitToLeader}
                        disabled={isSaving || isWaitingLeader || (!canSubmitToLeader && !isProcessing)}
                      >
                        <Send size={14} />
                        {isProcessing ? 'Xem chi tiết' : isWaitingLeader ? 'Đang chờ duyệt' : 'Trình GĐ'}
                      </button>
                      <button className="w-full md:w-48 bg-blue-50 text-blue-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all mt-1 md:mt-0">
                        <MessageCircle size={14} /> Chat Teams về VB này
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-10 text-center opacity-50">
                <div>
                  <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-sm font-medium text-gray-400">Chọn một văn bản để xem chi tiết</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload Modal (Simulation) */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsUploadModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-xl shadow-2xl relative z-60 overflow-hidden"
            >
              <div className="p-5 border-b border-teams-border flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-teams-purple flex items-center gap-2">
                  <FilePlus size={20} /> Tiếp nhận & Vào sổ văn bản
                </h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* File picker */}
                <div
                  className="border-2 border-dashed border-teams-purple/30 rounded-lg p-8 text-center bg-teams-purple/5 hover:bg-teams-purple/10 transition-all cursor-pointer group"
                  onClick={openFilePicker}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileSelection}
                  />
                  <Upload className="mx-auto text-teams-purple/50 group-hover:scale-110 transition-transform" size={40} />
                  <p className="mt-3 text-sm font-bold text-text-main">Chọn 1 hoặc nhiều tệp văn bản</p>
                  <p className="text-[10px] text-text-secondary mt-1">Hỗ trợ PDF, Word, Excel, ảnh; tối đa 25MB mỗi tệp</p>
                  <p className="text-[10px] text-teams-purple mt-2 font-semibold">
                    {selectedFileCount > 0 ? `Đã chọn ${selectedFileCount} tệp` : 'Nhấn để mở hộp chọn tệp'}
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Tệp đã chọn</label>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-[10px] font-semibold text-teams-purple hover:underline"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedFiles.map((file) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-teams-border bg-white px-3 py-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-teams-purple/10 flex items-center justify-center text-teams-purple shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text-main truncate">{file.name}</p>
                              <p className="text-[10px] text-text-secondary">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(file)}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                            aria-label={`Xóa ${file.name}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Số hiệu</label>
                    <input
                      type="text"
                      value={newDocForm.docNumber}
                      onChange={(event) => setNewDocForm((current) => ({ ...current, docNumber: event.target.value }))}
                      className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none focus:border-teams-purple"
                      placeholder="123..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Ký hiệu</label>
                    <input
                      type="text"
                      value={newDocForm.symbol}
                      onChange={(event) => setNewDocForm((current) => ({ ...current, symbol: event.target.value }))}
                      className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none focus:border-teams-purple"
                      placeholder="CV-VP..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Loại văn bản</label>
                    <select
                      value={newDocForm.type}
                      onChange={(event) => setNewDocForm((current) => ({ ...current, type: event.target.value }))}
                      className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none bg-white"
                    >
                      <option>Công văn</option>
                      <option>Quyết định</option>
                      <option>Tờ trình</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Độ khẩn</label>
                    <select
                      value={newDocForm.urgency}
                      onChange={(event) =>
                        setNewDocForm((current) => ({ ...current, urgency: event.target.value as ClericalUrgency }))
                      }
                      className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none bg-white"
                    >
                      <option value="Thường">Thường</option>
                      <option value="Khẩn">Khẩn</option>
                      <option value="Hỏa tốc">Hỏa tốc</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Đơn vị gửi</label>
                  <input
                    type="text"
                    value={newDocForm.sender}
                    onChange={(event) => setNewDocForm((current) => ({ ...current, sender: event.target.value }))}
                    className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none focus:border-teams-purple"
                    placeholder="Tên phòng ban/đơn vị gửi..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Trích yếu nội dung</label>
                  <textarea
                    value={newDocForm.title}
                    onChange={(event) => setNewDocForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full px-3 py-2 border border-teams-border rounded text-sm outline-none focus:border-teams-purple h-24"
                    placeholder="Tóm tắt ngắn gọn nội dung văn bản..."
                  ></textarea>
                </div>

                {/* Legal Alert Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-all">
                  <input
                    type="checkbox"
                    checked={isLegalAlertAcknowledged}
                    onChange={(e) => setIsLegalAlertAcknowledged(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-900">Văn bản này có tính pháp lý</span>
                  </div>
                </label>
              </div>

              <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-teams-border">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFiles([]);
                    setIsLegalAlertAcknowledged(false);
                  }}
                  className="px-4 py-2 text-sm font-bold text-text-secondary hover:underline"
                >
                  Hủy
                </button>
                <button onClick={handleCreateDocument} className="btn-primary px-8 py-2 shadow-md" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Hoàn tất & Lưu sổ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function UrgencyTag({ urgency, isOverdue }: { urgency: ClericalUrgency; isOverdue?: boolean }) {
  const styles = {
    'Hỏa tốc': 'bg-red-50 text-red-600 border-red-200',
    'Khẩn': 'bg-orange-50 text-orange-600 border-orange-200',
    'Thường': 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-fit ${styles[urgency]} ${
        isOverdue ? 'animate-pulse ring-2 ring-red-500 ring-offset-1' : ''
      }`}
    >
      {urgency === 'Hỏa tốc' && <Zap size={10} />}
      {urgency}
      {isOverdue && <span className="text-[8px] bg-red-600 text-white px-1 rounded ml-1 uppercase">Overdue</span>}
    </span>
  );
}

function StatusChip({ status }: { status: ClericalDocumentStatus }) {
  const styles: Record<ClericalDocumentStatus, string> = {
    INITIALIZED: 'bg-gray-100 text-gray-600',
    WAITING_LEADER: 'bg-amber-50 text-amber-700 border-amber-100',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
    WAITING_PUBLISH: 'bg-green-50 text-green-600 border-green-100',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const labels: Record<ClericalDocumentStatus, string> = {
    INITIALIZED: 'Khởi tạo',
    WAITING_LEADER: 'Chờ lãnh đạo duyệt',
    PROCESSING: 'Đang xử lý',
    REJECTED: 'Bị từ chối',
    WAITING_PUBLISH: 'Chờ ban hành',
    PUBLISHED: 'Đã ban hành',
  };

  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>{labels[status]}</span>;
}

function FlowStepDot({ status }: { status: ClericalFlowStepStatus }) {
  const className =
    status === 'Done'
      ? 'bg-green-500'
      : status === 'Current'
        ? 'bg-teams-purple animate-pulse'
        : 'bg-gray-300';

  return <div className={`absolute -left-4.25 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm z-10 ${className}`}></div>;
}
