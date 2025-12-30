import { create } from "zustand"

interface Notification {
  id: number
  title: string
  type: string
  created_at: string
  read: boolean
}

interface Store {
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markAsRead: (id: number) => void
  markAllRead: () => void
}

export const useNotifications = create<Store>((set) => ({
  notifications: [],

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50), // store up to 50
    })),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
}))
