// socket.js
import { io } from 'socket.io-client'

let socket

export const getSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:3000", {
      auth: {
        token: `Bearer ${token}`
      }
    })
  }
  return socket
}
