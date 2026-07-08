import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AlertItem = {
  id: number;
  message: string;
};

type AlertContextValue = {
  showAlert: (message: string) => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAppAlert must be used inside AlertProvider");
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export default function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const dismissAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showAlert = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setAlerts((prev) => [...prev, { id, message }]);

    window.setTimeout(() => {
      dismissAlert(id);
    }, 4500);
  }, [dismissAlert]);

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: unknown) => {
      const content = typeof message === "string" ? message : String(message ?? "");
      showAlert(content);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  const contextValue = useMemo(
    () => ({
      showAlert,
    }),
    [showAlert],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed top-5 right-5 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        {alerts.map((item) => (
          <div
            key={item.id}
            className="luxehome-alert-enter pointer-events-auto rounded-2xl border border-[#D4AF37]/60 bg-[#1F1A17]/95 px-4 py-3 text-[#FAF6F0] shadow-2xl backdrop-blur-md"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#1A1A1A]">
                !
              </span>
              <p className="flex-1 text-sm leading-relaxed">{item.message}</p>
              <button
                type="button"
                onClick={() => dismissAlert(item.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-[#EADBC8] transition hover:bg-white/10 hover:text-white"
                aria-label="Đóng thông báo"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}
