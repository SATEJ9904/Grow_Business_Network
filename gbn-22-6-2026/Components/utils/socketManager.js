import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from './apiConfig';

const originUrl = BASE_URL.replace(/\/api\/?$/, '');

let socket = null;
let socketToken = null;
let connecting = null;

/**
 * Shared Socket.IO connection, reused by MeetingPopup + NotificationBell.
 *
 * Previously each consumer opened its own socket inside a `useEffect(() =>
 * {...}, [])` that read the access token once on mount. Since both
 * components are mounted once at the App root (outside the navigator) and
 * never unmount, that effect only ever ran before login on a cold start —
 * when a user then logged in without restarting the app, no token was ever
 * present when the effect ran, so the socket never connected and real-time
 * events (new meeting / new notification) silently stopped arriving.
 *
 * `connectSocket` is safe to call repeatedly (e.g. on every navigation
 * change): it only opens a new connection when there's no live socket or
 * the stored access token has changed since the last connection.
 */
export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('accessToken');

  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket?.connected && socketToken === token) {
    return socket;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socketToken = token;
    const nextSocket = io(originUrl, { auth: { token }, transports: ['websocket'] });
    socket = nextSocket;
    connecting = null;
    return nextSocket;
  })();

  return connecting;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  socketToken = null;
  connecting = null;
};

export const getSocket = () => socket;
