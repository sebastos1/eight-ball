import { initOnlineTracking, initQueueTracking } from "./online.js";

// Connect
const socket = io();

initOnlineTracking(socket);
initQueueTracking(socket, "playersInQueue");

socket.emit("requestOnlineUpdate");