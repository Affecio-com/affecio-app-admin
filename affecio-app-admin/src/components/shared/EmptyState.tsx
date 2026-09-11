interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
      <h3 className="text-base font-semibold tracking-tight text-affecio-text">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-affecio-muted">{description}</p>
      ) : null}
    </div>
  );
}
