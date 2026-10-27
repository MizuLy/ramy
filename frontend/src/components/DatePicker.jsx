import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const POPOVER_WIDTH = 264;
const POPOVER_HEIGHT = 322;

const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const parseIso = (value) => {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return { y, m: m - 1, d };
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Due date",
  className = "",
}) {
  const selected = parseIso(value);
  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const [open, setOpen] = useState(false);
  const [view, setView] = useState({
    y: (selected || today).y,
    m: (selected || today).m,
  });
  const [pos, setPos] = useState({ top: 0, left: 0, up: false });
  const buttonRef = useRef(null);
  const popRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  const openPicker = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    const up =
      window.innerHeight - rect.bottom < POPOVER_HEIGHT + 16 &&
      rect.top > POPOVER_HEIGHT;
    const left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8);
    setPos({
      top: up ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, left),
      up,
    });
    const base = selected || today;
    setView({ y: base.y, m: base.m });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        !buttonRef.current?.contains(e.target) &&
        !popRef.current?.contains(e.target)
      ) {
        close();
      }
    };
    const handleScroll = (e) => {
      if (!popRef.current?.contains(e.target)) close();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const shiftMonth = (delta) => {
    setView((v) => {
      const date = new Date(v.y, v.m + delta, 1);
      return { y: date.getFullYear(), m: date.getMonth() };
    });
  };

  const pick = (iso) => {
    onChange(iso);
    close();
    buttonRef.current?.focus();
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const triggerLabel = selected
    ? new Date(selected.y, selected.m, selected.d).toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          ...(selected.y !== today.y && { year: "numeric" }),
        },
      )
    : placeholder;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : openPicker())}
        className={`inline-flex items-center gap-2 rounded-md border bg-zinc-900 px-2.5 py-2 text-xs outline-none transition-colors cursor-pointer hover:bg-zinc-800 focus-visible:border-accent/60 ${
          open ? "border-accent/60" : "border-zinc-800"
        } ${selected ? "text-zinc-300" : "text-zinc-500"} ${className}`}
      >
        <LuCalendar
          size={14}
          className={`shrink-0 ${selected ? "text-accent-soft" : "text-zinc-500"}`}
        />
        <span className="truncate">{triggerLabel}</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Choose due date"
            style={{
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              transform: pos.up ? "translateY(-100%)" : undefined,
            }}
            className="fixed z-[9999] rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl shadow-black/50 menu-pop select-none"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <LuChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-zinc-200">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <LuChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="pb-1 text-[11px] font-medium text-zinc-500"
                >
                  {d}
                </span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={`blank-${i}`} />;
                const isSelected =
                  selected &&
                  selected.y === view.y &&
                  selected.m === view.m &&
                  selected.d === day;
                const isToday =
                  today.y === view.y && today.m === view.m && today.d === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => pick(toIso(view.y, view.m, day))}
                    className={`mx-auto h-8 w-8 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-accent font-semibold text-accent-ink"
                        : isToday
                          ? "font-semibold text-accent-soft ring-1 ring-accent/40 hover:bg-zinc-800"
                          : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
              <button
                type="button"
                onClick={() => pick(toIso(today.y, today.m, today.d))}
                className="rounded-md px-2 py-1 text-xs font-medium text-accent-soft transition-colors hover:bg-accent/10"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => pick("")}
                disabled={!value}
                className="rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              >
                Clear
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
