import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

/** Единая шапка: стрелка назад слева, заголовок по центру, справа действие или пусто. */
export default function PageHeader({ title, onBack, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      {onBack ? (
        <button
          onClick={onBack}
          className="icon-btn"
          aria-label="Назад"
          title="Назад"
        >
          <ArrowLeft />
        </button>
      ) : (
        <span />
      )}
      <h1 className="page-title">{title}</h1>
      {action ?? <span />}
    </header>
  );
}
