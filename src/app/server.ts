import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './init';

const server = createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
