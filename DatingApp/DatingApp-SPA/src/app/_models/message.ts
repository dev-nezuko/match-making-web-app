export interface Message {
  id: number;
  senderId: number;
  senderKnownAs: string;
  senderPhotoUrl: string | null;
  recipientId: number;
  recipientKnownAs: string;
  recipientPhotoUrl: string | null;
  content: string;
  isRead: boolean;
  dateRead: string | null;
  messageSent: string;
}

export type MessageContainer = 'Unread' | 'Inbox' | 'Outbox';
