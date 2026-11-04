import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.newpanditmasala.shop/api').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/**
 * One shared realtime connection per browser tab.
 * The JWT is sent in the handshake and the server assigns the user/admin rooms,
 * so the token is re-read on every (re)connect — call `reconnectSocket()` after login/logout.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        let token: string | null = null;
        try {
          token = localStorage.getItem('pandit_token');
        } catch {
          // storage unavailable: connect anonymously
        }
        cb({ token });
      },
    });
  }
  return socket;
};

export const reconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect().connect();
};
