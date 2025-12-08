import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/favicon.svg";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password should be at least 6 characters");
      return;
    }

    setLoading(true);

    // Supabase automatically logs the user in when they click the email link.
    // So we just need to update the user object.
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccess(true);

      await supabase.auth.signOut();
      // Optional: Automatically redirect after 2 seconds
      setTimeout(() => {
        // You might want to redirect to dashboard since they are already logged in
        // Or send them to login to force a fresh start
        navigate("/");
      }, 2000);
    }
  }

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#fafafa]">
      <div className="bg-white w-full h-full lg:w-[450px] lg:h-auto lg:rounded-[12px] lg:shadow-lg flex flex-col items-center py-10">
        <img src={logo} alt="logo" className="h-[100px] rounded-full" />
        <h2 className="font-bold text-[24px] mt-2">Set New Password</h2>

        {success ? (
          <div className="text-center w-[330px] mt-5 animate-fade-in">
            <div className="text-green-600 font-bold mb-2 text-xl">
              Success!
            </div>
            <p className="text-gray-600 mb-6">
              Your password has been updated. Redirecting you...
            </p>
            <button onClick={() => navigate("/")} className="button-primary">
              Go to Login
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleUpdatePassword}
            className="w-full flex flex-col items-center"
          >
            <p className="text-[14px] text-center w-[330px] text-secondary mt-2 mb-6">
              Please enter your new password below.
            </p>

            <div className="w-[330px]">
              <label>
                <span className="font-medium">New Password</span>
                <input
                  type="password"
                  required
                  className="input-brand"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </label>
            </div>

            <div className="w-[330px] mt-4 mb-6">
              <label>
                <span className="font-medium">Confirm New Password</span>
                <input
                  type="password"
                  required
                  className="input-brand"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>

            {errorMessage && (
              <p className="text-red-600 text-sm mb-4 w-[330px] text-center">
                {errorMessage}
              </p>
            )}

            <button type="submit" disabled={loading} className="button-primary">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
