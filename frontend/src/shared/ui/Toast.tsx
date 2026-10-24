import { useEffect } from "react";

interface ToastProps {
  message: string;
  onHide: () => void;
}

/** Короткое сообщение об ошибке; скрывается само. */
export default function Toast({ message, onHide }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onHide, 4000);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <div className="toast toast-bad" role="alert">
      {message}
    </div>
  );
}
