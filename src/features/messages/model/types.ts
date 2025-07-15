import { Message } from '@shared/types/message';
import { PaginatedResult } from '@shared/types/pagination';

export type MessageWithSender = Message & {
  sender: { username: string };
};

export type PaginatedMessages = PaginatedResult<MessageWithSender>;
