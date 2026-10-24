import { create } from "zustand";
import { api } from "@/shared/api";
import type { Notification } from "@/shared/api";

interface NotificationState {
  items: Notification[];
  unread: number;
  load: () => Promise<void>;
  read: (id: string) => Promise<void>;
  readAll: () => Promise<void>;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,

  load: async () => {
    try {
      const res = await api.listNotifications();
      set({ items: res.items, unread: res.unread });
    } catch {
      // уведомления не критичны
    }
  },

  read: async (id) => {
    try {
      await api.readNotification(id);
      await get().load();
    } catch {
      // ignore
    }
  },

  readAll: async () => {
    try {
      await api.readAllNotifications();
      await get().load();
    } catch {
      // ignore
    }
  },

  clear: () => set({ items: [], unread: 0 }),
}));
