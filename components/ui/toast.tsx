"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; accent: string; iconColor: string }> = {
  success: { icon: CheckCircle2, accent: "border-l-[#3fb950]", iconColor: "text-[#3fb950]" },
  error: { icon: AlertCircle, accent: "border-l-[#f85149]", iconColor: "text-[#f85149]" },
  info: { icon: Info, accent: "border-l-[#58a6ff]", iconColor: "text-[#58a6ff]" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.floor(Math.random() * 1e9);
    setToasts((current) => [...current, { ...toast, id }]);
    setTimeout(() => dismiss(id), toast.tone === "error" ? 6000 : 3500);
  }, [dismiss]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-3 top-3 z-[200] flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2 rounded-md border border-[#30363d] border-l-2 ${style.accent} bg-[#161b22] p-3 shadow-xl shadow-black/40`}
            >
              <Icon size={15} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#e6edf3]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[11px] leading-4 text-[#8b949e]">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                title="Dismiss"
                onClick={() => dismiss(toast.id)}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#6e7681] transition hover:bg-[#30363d] hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
