import { useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function SignUp({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  // Form Data State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "staff">("student");

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [waitingForOtp, setWaitingForOtp] = useState(false);
  const [otp, setOtp] = useState("");

  // Initial Sign Up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    // 2. Success Handling
    // We don't need to manually insert into 'profiles' anymore!
    setLoading(false);
    setWaitingForOtp(true);
  }

  // Code verification
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    })

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    // Success
    setLoading(false);
    alert("Sign up successful! You can now log in.");

    onSwitchToLogin();
  }

  // Render OTP Verification Form - waiting for OTP
  if (waitingForOtp) {
    return (
      <form
        onSubmit={handleVerifyOtp}
        className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center"
      >
        <h2 className="font-bold text=[24px] mt-5">Enter OTP</h2>
        <h3 className="text-[14px] text-center w-[330px] text-secondary mb-5">
          We sent a 6 digit code to <br /> <span className="font-medium">{email}</span>
        </h3>

        <div className="w-[330px] mt-3">
          <label>
            <span className="font-medium">Confirmation Code</span>
            <input
              type="text"
              required
              className="input-brand text-center text-lg tracking-widest font-bold"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="------"
            />
          </label>
        </div>

        {errorMessage && (
          <p className="text-red-600 text-sm mb-3 mt-2">{errorMessage}</p>
        )}

        <button type="submit" disabled={loading} className="button-primary mt-5">
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <p
          className="text-sm text-gray-500 mt-4 cursor-pointer hover:underline"
          onClick={() => setWaitingForOtp(false)}
        >
          Back to Sign Up
        </p>
      </form>
    )
  }

  // Render Initial Sign Up Form
  return (
    <form
      onSubmit={handleSignUp}
      className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center "
    >
      <h2 className="font-bold text-[24px] mt-5">Create Your Account</h2>
      <h3 className="text-[14px] text-center w-[330px] text-secondary">
        Already have an account yet?
        <span
          className="underlined-text cursor-pointer"
          onClick={onSwitchToLogin}
        >
          {" "}
          Log in here
        </span>
      </h3>

      {/* Email */}
      <div className="w-[330px] mt-5">
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

      {/* Password */}
      <div className="w-[330px] mt-3">
        <label className="">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            className="input-brand"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>

      {/* Confirm Password */}
      <div className="w-[330px] mt-3">
        <label className="">
          <span className="font-medium">Confirm Password</span>
          <input
            type="password"
            required
            className="input-brand"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
      </div>

      {/* Full Name */}
      <div className="w-[330px] mt-3">
        <label className="">
          <span className="font-medium">Full Name</span>
          <input
            type="text"
            required
            className="input-brand"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
      </div>

      {/* Role Selection */}
      <div className="w-[330px] mt-3 mb-5">
        <label className="">
          <span className="font-medium">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "staff")}
            className="w-full mt-1 p-1 border rounded h-[35px]"
          >
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
        </label>
      </div>

      {errorMessage && (
        <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
      )}

      <button type="submit" disabled={loading} className="button-primary">
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
