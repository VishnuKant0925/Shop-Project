import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { corsOriginDelegate } from './config/cors';
import { JwtPayload } from './middleware/auth';
import { RevokedToken } from './models/RevokedToken';
import { User } from './models/User';

let io: SocketServer | undefined;

/**
 * Resolve the socket's user from the JWT sent in the handshake (`auth: { token }`).
 * Rooms are assigned server-side, so clients can no longer subscribe to the admin room
 * or to another user's notifications by emitting a "join" event.
 */
const identify = async (token: unknown): Promise<{ id: string; role: string } | null> => {
  if (typeof token !== 'string' || !token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'pandit_mill_secret_key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (decoded.jti && await RevokedToken.exists({ tokenId: decoded.jti })) return null;
    const user = await User.findById(decoded.id).select('role').lean();
    return user ? { id: String(user._id), role: user.role } : null;
  } catch {
    return null;
  }
};

export const initialiseRealtime = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: corsOriginDelegate,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
  });

  io.on('connection', async (socket) => {
    // Anonymous sockets are allowed: they only receive public catalogue/settings broadcasts.
    const user = await identify(socket.handshake.auth?.token);
    if (!user) return;
    socket.join(`user:${user.id}`);
    if (user.role === 'admin') socket.join('admin');
  });

  return io;
};

export const emitProductsChanged = (): void => {
  io?.emit('products:changed');
};

export const emitSettingsChanged = (): void => {
  io?.emit('settings:changed');
};

/** Notify a specific user that one of their orders changed status. */
export const emitOrderStatusChanged = (
  userId: string,
  data: { orderId: string; orderNumber: string; status: string }
): void => {
  io?.to(`user:${userId}`).emit('order:status-changed', data);
};

/** Notify a specific user about a new notification. */
export const emitNewNotification = (
  userId: string,
  notification: { id: string; type: string; title: string; message: string; createdAt: Date }
): void => {
  io?.to(`user:${userId}`).emit('notification:new', notification);
};

/** Notify all admins about a new notification (e.g. new order placed). */
export const emitAdminNotification = (
  notification: { id: string; type: string; title: string; message: string; createdAt: Date }
): void => {
  io?.to('admin').emit('notification:new', notification);
};
