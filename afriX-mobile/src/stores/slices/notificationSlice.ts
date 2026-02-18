// src/stores/slices/notificationSlice.ts
import { create } from "zustand";
import apiClient from "@/services/apiClient";

type NotificationState = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

  fetchUnreadCount: async () => {
    try {
      const res = await apiClient.get<{ success: boolean; unreadCount?: number }>(
        "/notifications",
        { params: { page: 1, limit: 1 } }
      );
      const count = res.data?.unreadCount ?? 0;
      set({ unreadCount: Math.max(0, count) });
    } catch {
      set({ unreadCount: 0 });
    }
  },
}));
