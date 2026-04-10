import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { NOTIFICATION_EVENTS, NotificationPayload } from "./notification.events";

export class NotificationService {
  constructor(private app: FastifyInstance) {}

  /** Send notification to a specific user */
  sendToUser(
    userId: number,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const payload: NotificationPayload = {
      id: randomUUID(),
      type,
      title,
      message,
      data,
      createdAt: new Date().toISOString(),
    };
    this.app.io.to(`user:${userId}`).emit(NOTIFICATION_EVENTS.NOTIFY, payload);
  }

  /** Broadcast notification to all connected users */
  broadcast(
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const payload: NotificationPayload = {
      id: randomUUID(),
      type,
      title,
      message,
      data,
      createdAt: new Date().toISOString(),
    };
    this.app.io.emit(NOTIFICATION_EVENTS.BROADCAST, payload);
  }

  /** Send notification to a named room */
  sendToRoom(
    room: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const payload: NotificationPayload = {
      id: randomUUID(),
      type,
      title,
      message,
      data,
      createdAt: new Date().toISOString(),
    };
    this.app.io.to(room).emit(NOTIFICATION_EVENTS.NOTIFY, payload);
  }
}
