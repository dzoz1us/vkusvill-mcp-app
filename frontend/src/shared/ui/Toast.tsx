import { useEffect } from "react";

interface ToastProps {
  message: string;
  onHide: () => void;
  kind?: "bad" | "ok";
}

/** Короткое сообщение об ошибке; скрывается само. */
export default function Toast({ message, onHide, kind = "bad" }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onHide, 4000);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <div className={`toast ${kind === "ok" ? "toast-ok" : "toast-bad"}`} role="alert">
      {message}
    </div>
  );
}
