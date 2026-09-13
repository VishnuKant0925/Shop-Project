import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | undefined;

export const initialiseRealtime = (server: HttpServer): SocketServer => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  io = new SocketServer(server, {
    cors: {
      origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET'],
    },
  });

  return io;
};

export const emitProductsChanged = (): void => {
  io?.emit('products:changed');
};
