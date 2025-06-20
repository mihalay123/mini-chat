import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from './../generated/prisma';
import { verifyToken } from '@shared/service/jwt';
import { generateAccessToken, generateRefreshToken } from '@features/auth/service/jwt';

const router = Router();

const prisma = new PrismaClient();

router.post('/login', async (req: Request, res: Response) => {
  try {
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

    const token = generateAccessToken({
      id: user.id,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
    });

    // await saveRefreshToken(prisma, refreshToken, user.id, req);

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    const payload = verifyToken(refreshToken);

    if (!payload) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      res.status(403).json({ error: 'Refresh token not found' });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      res.status(403).json({ error: 'Refresh token expired' });
      return;
    }

    const newAccessToken = generateAccessToken({
      id: payload.id,
      username: payload.username,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
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

    const token = generateAccessToken({
      id: newUser.id,
      username: newUser.username,
    });

    const refreshToken = generateRefreshToken({
      id: newUser.id,
      username: newUser.username,
    });

    // await saveRefreshToken(prisma, refreshToken, newUser.id, req);

    res.json({
      message: 'Registration successful',
      user: { id: newUser.id, username: newUser.username },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
