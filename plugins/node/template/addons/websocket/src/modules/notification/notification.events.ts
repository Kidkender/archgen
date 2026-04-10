export const NOTIFICATION_EVENTS = {
  // Server → Client
  NOTIFY: "notification:new",
  BROADCAST: "notification:broadcast",

  // Client → Server
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
} as const;

export type NotificationEvent =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}
