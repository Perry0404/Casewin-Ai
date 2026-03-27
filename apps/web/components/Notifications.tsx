'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'deposit'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
}

interface NotificationContextValue {
  notify: (n: Omit<Notification, 'id'>) => void
  notifyDeposit: (amount: number, reference?: string) => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
  notifyDeposit: () => {},
})

const ICONS: Record<NotificationType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  deposit: '💰',
}

const BG_COLORS: Record<NotificationType, string> = {
  success: 'from-green-600/90 to-green-700/90 border-green-400/50',
  error: 'from-red-600/90 to-red-700/90 border-red-400/50',
  info: 'from-blue-600/90 to-blue-700/90 border-blue-400/50',
  deposit: 'from-green-600/90 to-emerald-700/90 border-green-300/50',
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setNotifications((prev) => [...prev, { ...n, id }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  const notifyDeposit = useCallback(
    (amount: number, reference?: string) => {
      notify({
        type: 'deposit',
        title: 'Deposit Successful!',
        message: `₦${amount.toLocaleString()} has been added to your wallet.${reference ? ` Ref: ${reference}` : ''}`,
      })
    },
    [notify]
  )

  return (
    <NotificationContext.Provider value={{ notify, notifyDeposit }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto bg-gradient-to-r ${BG_COLORS[n.type]} backdrop-blur-xl border rounded-xl p-4 shadow-2xl text-white animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{ICONS[n.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-white/80 mt-0.5 break-words">{n.message}</p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
