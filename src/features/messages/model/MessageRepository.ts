import { MessageWithSender } from './types';

export interface MessageRepository {
  sendMessage(chatId: string, userId: string, text: string): Promise<MessageWithSender | null>;
  getMessages(chatId: string, userId: string): Promise<MessageWithSender[]>;
}
