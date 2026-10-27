import React from "react";
import { FiRefreshCw, FiTrash2, FiAlertCircle } from "react-icons/fi";

export default function JournalTrash({
  trashedJournals,
  onRestore,
  onPermanentDelete,
}) {
  if (trashedJournals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
        <FiTrash2 className="mx-auto h-8 w-8 text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-400">Trash is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
        <FiAlertCircle className="h-4 w-4 shrink-0" />
        <span>Items here can be restored or permanently deleted.</span>
      </div>

      <div className="space-y-3">
        {trashedJournals.map((item) => {
          const id = item.id || item._id;
          return (
            <div
              key={id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="max-w-md">
                <h4 className="text-sm font-semibold text-zinc-300 line-clamp-1">
                  {item.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                  {item.body}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRestore(id)}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  <FiRefreshCw className="h-3 w-3" />
                  <span>Restore</span>
                </button>

                <button
                  onClick={() => onPermanentDelete(id)}
                  className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger-soft hover:bg-danger/20 transition-colors"
                >
                  <FiTrash2 className="h-3 w-3" />
                  <span>Delete Forever</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
