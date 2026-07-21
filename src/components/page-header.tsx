export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-slide-in-left flex min-w-0 flex-wrap items-start justify-between gap-3 pb-1">
      <div className="relative min-w-0 flex-1">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 break-words text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <span className="gradient-surface mt-3 block h-1 w-14 rounded-full" />
      </div>
      {action && (
        <div className="animate-scale-in w-full min-w-0 sm:w-auto">{action}</div>
      )}
    </div>
  );
}
