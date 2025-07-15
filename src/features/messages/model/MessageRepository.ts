import { MessageWithSender, PaginatedMessages } from './types';

export interface MessageRepository {
  sendMessage(chatId: string, userId: string, text: string): Promise<MessageWithSender | null>;
  getMessages(chatId: string, cursor?: string, limit?: number): Promise<PaginatedMessages>;
  isChatMember(chatId: string, userId: string): Promise<boolean>;
}
