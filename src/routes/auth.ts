import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

const registeredUsers: { username: string; password: string }[] = [
  { username: 'admin', password: bcrypt.hashSync('password', 10) },
];

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = registeredUsers.find((user) => user.username === username);

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
    { username },
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

  const userExists = registeredUsers.some((user) => user.username === username);
  if (userExists) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  registeredUsers.push({ username, password: hashedPassword });
  res.json({ message: 'Registration successful', user: { username } });
});

export default router;
