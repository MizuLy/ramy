export default function PageShell({ children }) {
  return (
    <div className="h-full flex-1 overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-8 sm:pb-16">
        {children}
      </div>
    </div>
  );
}
