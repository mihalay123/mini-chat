import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const registeredUsers: { username: string; password: string }[] = [
  { username: 'admin', password: 'password' },
];

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = registeredUsers.find(
    (user) => user.username === username && user.password === password
  );

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { username, password },
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

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userExists = registeredUsers.some((user) => user.username === username);
  if (userExists) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  registeredUsers.push({ username, password });
  res.json({ message: 'Registration successful', user: { username } });
});

export default router;
