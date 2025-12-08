import { useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function ForgotPassword({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); // Prevents page reload
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    // CHANGED: 'div' -> 'form' so Enter key works
    <form
      onSubmit={handleReset}
      className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center"
    >
      <h2 className="font-bold text-[24px] mt-5">Reset Password</h2>

      {sent ? (
        <div className="text-center mt-5">
          <p className="text-green-700 w-[330px] mb-4">
            If an account exists for <b>{email}</b>, you will receive a password
            reset link shortly.
          </p>
          <p
            className="underlined-text cursor-pointer"
            onClick={onSwitchToLogin}
          >
            Back to Login
          </p>
        </div>
      ) : (
        <>
          <div className="w-[330px] mt-5 mb-5">
            <label className="">
              <span className="font-medium">Email</span>
              <input
                type="email"
                required
                className="input-brand"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm mb-3 w-[330px] text-center">
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={loading} className="button-primary">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p
            className="underlined-text mt-4 cursor-pointer"
            onClick={onSwitchToLogin}
          >
            Back to Login
          </p>
        </>
      )}
    </form>
  );
}
