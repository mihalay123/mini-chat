import { MessageWithSender } from './types';

export interface MessageRepository {
  sendMessage(chatId: string, userId: string, text: string): Promise<MessageWithSender | null>;
}
