import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './socket/init';

const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

import jwt from 'jsonwebtoken';

// const token = jwt.sign(
//   { id: '123', username: 'alice' },
//   process.env.JWT_SECRET || 'your_secret_here',
//   { expiresIn: '1h' }
// );
// console.log(token);

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3NTAxNzU4ODYsImV4cCI6MTc1MDE3OTQ4Nn0.Enrfmbtxa66oHaHsBltYtrMZfiYie5jvRlcJjNxs_Xo
