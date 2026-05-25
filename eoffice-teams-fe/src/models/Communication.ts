export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  platform: 'Teams' | 'eOffice';
  isOnline: boolean;
  joinUrl: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  mentions?: string[];
}