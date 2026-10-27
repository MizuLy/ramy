import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { login } from "../../api/axios";
import ramyLogo from "../../assets/ram.png"; // Adjust depth if needed relative to this file

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAccessToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(formData);
      setAccessToken(res.data.accessToken);

      const userData = res.data.data;
      const avatarUrl = userData?.image || userData?.avatar;
      setUser({
        ...userData,
        avatar: avatarUrl,
        image: avatarUrl,
      });
      navigate("/");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Login | Ramy";
  }, []);

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex overflow-hidden selection:bg-accent/30 selection:text-accent-soft">
      {/* LEFT SIDE: Visual Brand / Atmospheric Section (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 lg:p-16 bg-zinc-900/60 border-r border-zinc-800/80 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-strong/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-strong/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={ramyLogo}
            alt="Ramy Logo"
            className="w-8 h-8 object-contain rounded-lg"
          />
          <span className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
            RAMY
          </span>
        </div>

        {/* Atmospheric Copy */}
        <div className="relative z-10 max-w-lg space-y-4">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            All your notes, tasks, and ideas in one high-performance workspace.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Minimal, fast, and engineered to keep you focused on what matters
            most.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} Ramy. Built for speed.
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Mobile Brand / Logo (Shows only on smaller screens above the form) */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <img
            src={ramyLogo}
            alt="Ramy Logo"
            className="w-8 h-8 object-contain rounded-lg"
          />
          <span className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
            RAMY
          </span>
        </div>

        {/* Mobile Background Ambient Glow */}
        <div className="lg:hidden fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent-strong/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm space-y-6">
          {/* Form Header */}
          <div className="space-y-1.5 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex flex-col gap-1.5 p-3 text-xs bg-danger/10 border border-danger/20 text-danger-soft rounded-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
                <span>{error}</span>
                {error === "Please verify your email first" && (
                  <Link
                    to="/verify-otp"
                    state={{ email: formData.email }}
                    className="font-medium text-danger-soft underline hover:text-danger-soft transition-colors w-fit"
                  >
                    Verify email address →
                  </Link>
                )}
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
                name="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-accent hover:bg-accent-soft active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-accent-ink text-sm font-medium rounded-lg shadow-lg shadow-accent/20 transition-all duration-150 flex justify-center items-center"
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
                  <span>Logging in...</span>
                </div>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-zinc-400">
            <span>Don't have an account? </span>
            <Link
              to="/register"
              className="text-accent-soft font-medium hover:text-accent-soft hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
