
import { TaskModel, Meeting, ChatMessage } from '../types';

const MOCK_TASKS: TaskModel[] = [
  {
    id: 'TASK-101',
    title: 'Soạn thảo tờ trình phê duyệt dự án Chuyển đổi số 2.0',
    description: 'Cần liệt kê chi tiết các hạng mục đầu tư và lộ trình triển khai trong năm 2024.',
    sender: 'Lê Trưởng Phòng',
    status: 'Doing',
    priority: 'High',
    deadline: '2024-04-30',
    createdAt: '2024-04-20',
    aiSummary: 'Ý kiến sếp: "Tập trung vào hiệu quả chi phí và khả năng tích hợp hệ thống cũ".',
    attachments: ['chidao_duan.pdf']
  },
  {
    id: 'TASK-102',
    title: 'Rà soát văn bản quy định về ATTT mới ban hành',
    description: 'Đối chiếu các quy định mới với hệ thống hiện tại để tìm điểm cần cập nhật.',
    sender: 'Lê Trưởng Phòng',
    status: 'Todo',
    priority: 'Medium',
    deadline: '2024-05-05',
    createdAt: '2024-04-25',
  },
  {
    id: 'TASK-103',
    title: 'Báo cáo tuần lễ ATTT',
    description: 'Tổng hợp số liệu từ các đơn vị gửi về.',
    sender: 'Lê Trưởng Phòng',
    status: 'Completed',
    priority: 'Low',
    deadline: '2024-04-26',
    createdAt: '2024-04-22',
  }
];

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'MEET-01',
    title: 'Họp giao ban Phòng CNTT',
    startTime: '2024-04-27T08:30:00Z',
    endTime: '2024-04-27T10:00:00Z',
    platform: 'Teams',
    isOnline: true,
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/...'
  },
  {
    id: 'MEET-02',
    title: 'Thảo luận kỹ thuật Dự án 2.0',
    startTime: '2024-04-27T14:00:00Z',
    endTime: '2024-04-27T15:30:00Z',
    platform: 'eOffice',
    isOnline: true,
    joinUrl: 'https://eoffice.gov.vn/meeting/...'
  }
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG-01',
    senderId: 'm-01',
    senderName: 'Lê Trưởng Phòng',
    content: '@Anh Tuấn Lưu ý sửa lại phần ngân sách trong bản dự thảo nhé.',
    timestamp: '2024-04-27T09:00:00Z',
    mentions: ['Anh Tuấn']
  },
  {
    id: 'MSG-02',
    senderId: 'm-02',
    senderName: 'Nguyễn Chuyên Viên',
    content: 'Đã gửi file kết quả xử lý lên hệ thống rồi ạ.',
    timestamp: '2024-04-27T10:30:00Z'
  }
];

export const specialistService = {
  getTasks: async (): Promise<TaskModel[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_TASKS), 500);
    });
  },

  getMeetings: async (): Promise<Meeting[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_MEETINGS), 300);
    });
  },

  getMessages: async (): Promise<ChatMessage[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_MESSAGES), 400);
    });
  },

  updateTaskProgress: async (taskId: string, progress: number): Promise<boolean> => {
    console.log(`Updating task ${taskId} progress to ${progress}%`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },

  acceptTask: async (taskId: string): Promise<boolean> => {
    console.log(`Accepting task ${taskId}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },

  completeTask: async (taskId: string): Promise<boolean> => {
    console.log(`Completing task ${taskId}`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 300));
  },

  aiDecoder: async (content: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(`Giải mã từ AI: Dựa trên Điều 12 Luật CNTT, nội dung này yêu cầu...`), 1000);
    });
  },

  aiDraft: async (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(`CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nBẢN DỰ THẢO: ${prompt}\n...`), 1500);
    });
  },

  aiSearch: async (query: string): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(['Hồ sơ chuyển đổi số 2023.pdf', 'Quy định ATTT v1.2.docx']), 800);
    });
  },
  
  extractTasksFromDocument: async (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(['Soạn thảo tờ trình (Hạn 30/4)', 'Gửi email báo cáo (Hạn 2/5)']), 2000);
    });
  }
};
