import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PiNotebookLight } from "react-icons/pi";
import { useAuth } from "../../context/AuthProvider";

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Ramy";
  }, []); // Added dependency array so document.title only sets once on mount

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-950 text-white px-4 select-none">
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 mb-6 shadow-2xl backdrop-blur-md">
        <PiNotebookLight size={40} className="text-zinc-300 stroke-[1.5]" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight mb-2 text-zinc-100">
        Welcome back, {user?.name || "there"}
      </h1>

      <p className="text-xs text-zinc-500 mb-8 text-center max-w-xs leading-relaxed">
        Your notes, tags, and ideas all live here. Pick up where you left off,
        or start something new.
      </p>

      <Link
        to="/notes"
        className="px-5 py-2 rounded-md bg-accent text-accent-ink text-xs font-medium hover:bg-accent-soft transition-all duration-150 active:scale-95 shadow-sm"
      >
        Go to My Notes
      </Link>
    </div>
  );
}
