import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:5001'; // Flask Sunucusu

export const socket = io(SOCKET_URL, {
  transports: ['websocket'], // HTTP long polling yerine WebSocket kullan
});
