import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './init';
import { ENV } from '@shared/config/env';

const server = createServer(app);
initSocket(server);

const PORT = ENV.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
