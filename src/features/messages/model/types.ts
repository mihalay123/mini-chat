import { Message } from '@shared/types/message';

export type MessageWithSender = Message & {
  sender: { username: string };
};
