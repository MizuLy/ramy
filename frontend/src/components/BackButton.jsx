import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

export default function BackButton({
  to = "/",
  label = "Back",
  always = false,
  iconOnly = false,
  className = "",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (!always && window.history.state?.idx > 0) navigate(-1);
    else navigate(to);
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label={label}
        title={label}
        className={`shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white ${className}`}
      >
        <LuArrowLeft size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ${className}`}
    >
      <LuArrowLeft size={14} />
      {label}
    </button>
  );
}
