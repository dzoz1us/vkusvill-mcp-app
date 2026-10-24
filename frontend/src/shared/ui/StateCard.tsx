import type { ReactNode } from "react";

interface StateCardProps {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}

/** Пустое состояние / ошибка: иконка, короткий заголовок, при необходимости фраза и кнопка. */
export default function StateCard({ icon, title, text, action }: StateCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="tile tile-sun mx-auto mb-4 h-20 w-20 [&_img]:h-12 [&_img]:w-12">
          {icon}
        </div>
        <h2 className="mb-2 text-[28px] leading-tight font-bold">{title}</h2>
        {text && <p className="text-muted mb-6">{text}</p>}
        {!text && <div className="mb-4" />}
        {action}
      </div>
    </div>
  );
}
