import { Request, Response } from 'express';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    id: req.user.id,
    username: req.user.username,
  });
};
