import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Окно по центру экрана. Закрывается крестиком, Esc и кликом по подложке. */
export default function Sheet({ title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-[28px] leading-tight font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Закрыть"
            title="Закрыть"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
