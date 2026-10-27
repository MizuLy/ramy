import { useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "../../components/BackButton";
import { forgotPassword } from "../../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="w-full bg-zinc-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800/80 space-y-5">
        <BackButton to="/login" label="Back to login" always />

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Forgot password?
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your email address and we'll send you a recovery link
          </p>
        </div>

        {/* Success View */}
        {submitted ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg backdrop-blur-sm flex items-start gap-3">
              <svg
                className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="leading-relaxed">{message}</span>
            </div>

            <button
              onClick={() => setSubmitted(false)}
              className="w-full py-2.5 px-4 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700/50 transition-all duration-150"
            >
              Try another email
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="p-3 text-xs bg-danger/10 border border-danger/20 text-danger-soft rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  <span>Sending link...</span>
                </div>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center pt-2 text-xs text-zinc-400">
          <span>Remembered your password? </span>
          <Link
            to="/login"
            className="text-accent-soft font-medium hover:text-accent-soft hover:underline transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
