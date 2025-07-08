import { Request, Response } from 'express';

export const createChat = (req: Request, res: Response) => {
  res.json({ message: 'OK' });
};
