import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface SocketUser {
  userId: number;
  email: string;
}

declare module "fastify" {
  interface FastifyInstance {
    io: SocketServer;
  }
}

const socketPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const io = new SocketServer(fastify.server, {
    // Use websocket transport only to avoid Fastify router conflict with HTTP polling
    transports: ["websocket"],
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT auth middleware for every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser;
    fastify.log.info(`Socket connected: userId=${user.userId}`);

    // Each user auto-joins their personal room
    socket.join(`user:${user.userId}`);

    socket.on("room:join", (room: string) => {
      socket.join(room);
      fastify.log.debug(`userId=${user.userId} joined room: ${room}`);
    });

    socket.on("room:leave", (room: string) => {
      socket.leave(room);
      fastify.log.debug(`userId=${user.userId} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      fastify.log.info(`Socket disconnected: userId=${user.userId}`);
    });
  });

  fastify.decorate("io", io);

  fastify.addHook("onClose", (_instance, done) => {
    io.close();
    done();
  });
});

export default socketPlugin;
