import { useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function ForgotPassword({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
    });

    if (!error) setSent(true);
  }

  return (
    <div className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center">
      <h2 className="font-bold text-[24px] mt-5">Reset Password</h2>

      {sent ? (
        <p className="text-green-700">
          Password reset email sent. Check your inbox.
        </p>
      ) : (
        <>
          <div className="w-[330px] mt-5 mb-5">
            <label className="">
              <span>Email</span>
              <input
                type="email"
                className="input-brand"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <button onClick={handleReset} className="button-primary">
            Send Reset Link
          </button>
          <p
            className="underlined-text"
            onClick={onSwitchToLogin}
          >
            Back to Login
          </p>
        </>
      )}
    </div>
  );
}
