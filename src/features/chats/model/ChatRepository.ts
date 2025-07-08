import { Chat } from '@shared/types/chat';

export interface ChatRepository {
  createChat(userId: string, name?: string, isGroup?: boolean): Promise<Chat | null>;
}
