import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from './../generated/prisma';

const router = Router();

const prisma = new PrismaClient();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'your_secret_here',
    {
      expiresIn: '1h',
    }
  );

  res.json({ message: 'Login successful', token });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
});

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userExists = await prisma.user.findUnique({
    where: { username },
  });
  if (userExists) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    process.env.JWT_SECRET || 'your_secret_here',
    {
      expiresIn: '1h',
    }
  );

  res.json({
    message: 'Registration successful',
    user: { id: newUser.id, username: newUser.username },
    token,
  });
});

export default router;
