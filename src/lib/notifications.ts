import { supabase } from "./supabase"

export const subscribeToNotifications = (userId: string, callback: (notification: any) => void) => {
  return supabase
    .channel('notification-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
}
