import BackButton from "./BackButton";

export default function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  backTo = "/",
}) {
  return (
    <header className="sticky top-0 z-20 mb-4 border-b border-zinc-800 bg-zinc-950 pb-4 pt-4 sm:mb-6 sm:pb-5 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton iconOnly to={backTo} />
          {Icon && (
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-soft sm:flex">
              <Icon size={20} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="truncate text-xs text-zinc-500 sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
