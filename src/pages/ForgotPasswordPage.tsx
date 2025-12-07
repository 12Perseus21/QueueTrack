import { useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function handleReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
    });

    if (!error) setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

        {sent ? (
          <p className="text-green-700">
            Password reset email sent. Check your inbox.
          </p>
        ) : (
          <>
            <label className="block mb-3">
              <span>Email</span>
              <input
                type="email"
                className="w-full p-2 mt-1 border rounded"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              onClick={handleReset}
              className="w-full py-2 bg-blue-600 text-white rounded"
            >
              Send Reset Link
            </button>
            <p
            className="text-sm text-blue-600 text-center mt-4 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
            >
            Back to Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}
