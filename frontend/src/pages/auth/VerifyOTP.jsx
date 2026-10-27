import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../../components/BackButton";
import { verifyOtp, requestOtp } from "../../api/axios";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  if (!email) return null;

  const handleChange = (index, value) => {
    const rawDigit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = rawDigit;
    setDigits(newDigits);

    if (rawDigit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!pasted) return;

    const newDigits = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const targetIndex = Math.min(pasted.length - 1, 3);
    inputRefs.current[targetIndex]?.focus();
  };

  const otp = digits.join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await verifyOtp({ email, otp });
      setMessage("Email verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid or expired OTP";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setError("");
    setMessage("");
    setResending(true);

    try {
      await requestOtp({ email });
      setMessage("A new code has been sent to your email.");
      setDigits(["", "", "", ""]);
      setCooldown(30);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to resend OTP";
      setError(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black/80">
      <BackButton to="/login" label="Back to login" always className="mb-4" />

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
          Verify your email
        </h2>
        <p className="text-sm text-zinc-400">
          We sent a 4-digit verification code to <br />
          <span className="text-zinc-200 font-medium underline underline-offset-4 decoration-zinc-700">
            {email}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Input Fields */}
        <div className="flex justify-center gap-3.5" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
              className={`w-14 h-16 text-center text-2xl font-semibold rounded-xl bg-zinc-900/90 text-white outline-none border transition-all duration-200 ${
                digit
                  ? "border-zinc-400 ring-2 ring-zinc-400/20 bg-zinc-900"
                  : "border-zinc-800 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
              } focus:scale-[1.03]`}
            />
          ))}
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger-soft text-center font-medium animate-fadeIn">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 text-center font-medium animate-fadeIn">
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || otp.length !== 4}
          className="w-full py-3 rounded-xl bg-accent text-accent-ink font-semibold hover:bg-accent-soft active:scale-[0.99] disabled:opacity-40  disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-accent-ink"
                viewBox="0 0 24 24"
                fill="none"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      {/* Resend Action */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Didn't receive code? Resend in ${cooldown}s`
              : "Didn't receive code? Resend code"}
        </button>
      </div>
    </div>
  );
}
