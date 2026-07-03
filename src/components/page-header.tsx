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
    <div className="animate-slide-in-left flex flex-wrap items-start justify-between gap-3 pb-1">
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
        <span className="gradient-surface mt-3 block h-1 w-14 rounded-full" />
      </div>
      {action && <div className="shrink-0 animate-scale-in">{action}</div>}
    </div>
  );
}
