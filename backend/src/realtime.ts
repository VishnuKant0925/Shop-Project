import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | undefined;

export const initialiseRealtime = (server: HttpServer): SocketServer => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  io = new SocketServer(server, {
    cors: {
      origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
  });

  io.on('connection', (socket) => {
    // Authenticated clients join their personal room to receive order updates.
    socket.on('join', (userId: string) => {
      if (typeof userId === 'string' && userId.length > 0) {
        socket.join(`user:${userId}`);
      }
    });
  });

  return io;
};

export const emitProductsChanged = (): void => {
  io?.emit('products:changed');
};

/** Notify a specific user that one of their orders changed status. */
export const emitOrderStatusChanged = (
  userId: string,
  data: { orderId: string; orderNumber: string; status: string }
): void => {
  io?.to(`user:${userId}`).emit('order:status-changed', data);
};
