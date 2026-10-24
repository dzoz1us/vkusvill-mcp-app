/** Скелетон по форме будущих карточек вместо пустой страницы. */
export default function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="page" aria-busy="true" aria-label="Загрузка">
      <div className="page-header">
        <span />
        <div className="skeleton mx-auto h-10 w-2/3" />
        <span />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    </div>
  );
}
