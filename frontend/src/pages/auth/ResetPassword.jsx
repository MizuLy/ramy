import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import BackButton from "../../components/BackButton";
import { resetPassword } from "../../api/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to reset password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800/80 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger-soft">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Invalid reset link
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            This token is missing or expired. Please request a new link.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-block text-xs font-medium text-accent-soft hover:text-accent-soft hover:underline transition-colors pt-2"
        >
          Request a new link →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800/80 space-y-5"
      >
        <BackButton to="/login" label="Back to login" always />

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set new password
          </h1>
          <p className="text-xs text-zinc-400">
            Choose a new secure password for your account
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 text-xs bg-danger/10 border border-danger/20 text-danger-soft rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="newPassword"
            className="block text-xs font-medium text-zinc-300"
          >
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-white placeholder-zinc-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-all duration-200"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-zinc-300"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-white placeholder-zinc-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-all duration-200"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-accent hover:bg-accent-soft active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-accent-ink text-sm font-medium rounded-lg shadow-lg shadow-accent/20 transition-all duration-150 flex justify-center items-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-accent-ink"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Resetting password...</span>
            </div>
          ) : (
            "Reset password"
          )}
        </button>

        {/* Footer */}
        <div className="text-center pt-2 text-xs">
          <Link
            to="/login"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
