import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { LuCheck, LuChevronDown } from "react-icons/lu";

const VARIANTS = {
  outline:
    "border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs",
  dashed:
    "border border-dashed border-zinc-700 bg-transparent text-zinc-400 hover:text-accent-soft hover:border-accent/60 rounded-lg px-2.5 py-1 text-xs",
};

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select",
  label,
  icon: Icon,
  variant = "outline",
  triggerClassName = "",
  menuWidth,
  title,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0, up: false });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const triggerText = label ?? selected?.label ?? placeholder;

  const close = useCallback(() => setOpen(false), []);

  const openMenu = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.max(menuWidth || 0, rect.width, 128);
    const estHeight = Math.min(options.length * 32 + 8, 248);
    const up = window.innerHeight - rect.bottom < estHeight + 16 && rect.top > estHeight;
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setPos({
      top: up ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, left),
      minWidth: width,
      up,
    });
    setActiveIndex(options.findIndex((o) => o.value === value));
    setOpen(true);
  };

  const select = (option) => {
    onChange(option.value);
    close();
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        !buttonRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        close();
      }
    };
    const handleScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[activeIndex]) select(options[activeIndex]);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center gap-1.5 font-medium outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border-accent/60 ${
          triggerClassName || VARIANTS[variant]
        } ${open ? "border-accent/60" : ""}`}
      >
        {Icon && <Icon size={14} className="shrink-0 text-zinc-500" />}
        <span className="truncate">{triggerText}</span>
        <LuChevronDown
          size={14}
          className={`shrink-0 text-zinc-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: pos.minWidth,
              transform: pos.up ? "translateY(-100%)" : undefined,
            }}
            className="fixed z-[9999] max-h-60 max-w-[18rem] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl shadow-black/50 menu-pop"
          >
            {options.length === 0 ? (
              <div className="px-2.5 py-2 text-xs text-zinc-500">
                Nothing here yet
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => select(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-accent/15 font-medium text-accent-soft"
                        : index === activeIndex
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <LuCheck size={14} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
