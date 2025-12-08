import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
}

export default function Login({
  onSwitchToSignup,
  onSwitchToForgot,
}: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if already logged in
  // Redirect if already logged in (Robust Version)
  useEffect(() => {
    const checkUser = async () => {
      // 1. Check if Supabase thinks we are logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 2. Try to fetch the profile safely
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(); // <--- USE maybeSingle() TO PREVENT CRASH

        // 3. Logic: If we have a user but NO profile, the data is corrupt/stale.
        if (!profile || error) {
          console.warn("Found ghost user. Logging out to clean up.");
          await supabase.auth.signOut(); // Force logout to fix the issue
          return;
        }

        // 4. If profile exists, redirect as normal
        if (profile.role === "student") navigate("/student/dashboard");
        if (profile.role === "staff") navigate("/staff/dashboard");
        if (profile.role === "admin") navigate("/staff/dashboard");
      }
    };

    checkUser();
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); // 1. Supabase Auth Login

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage("Login successful but no user data found.");
      setLoading(false);
      return;
    } // 2. Fetch User Profile safely

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle(); // <--- CHANGE THIS from .single() to .maybeSingle()

    setLoading(false);

    // Check for DB error
    if (profileError) {
      console.error("Database Error:", profileError);
      setErrorMessage("Login successful, but failed to load profile.");
      return;
    }

    // Check if profile is missing (Ghost User)
    if (!profile) {
      setErrorMessage(
        "Profile not found. Please contact support or sign up again."
      );
      return;
    } // 3. Navigate based on role

    if (profile.role === "student") {
      navigate("/student/dashboard");
    } else if (profile.role === "staff") {
      navigate("/staff/dashboard");
    } else if (profile.role === "admin") {
      navigate("/staff/dashboard");
    } else {
      setErrorMessage("No role assigned to this account.");
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center"
    >
      <h2 className="font-bold text-[24px] mt-5">Login Account</h2>
      <h3 className="text-[14px] text-center w-[330px] text-secondary">
        Dont have an account yet?{" "}
        <span
          className="underlined-text cursor-pointer"
          onClick={onSwitchToSignup}
        >
          Sign up here
        </span>
      </h3>

      <div className="w-[330px] mt-5">
        <label>
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

      <div className="w-[330px] mt-3 mb-5">
        <label className="block mb-4">
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

      <button type="submit" disabled={loading} className="button-primary mb-2">
        {loading ? "Logging in..." : "Login"}
      </button>

      {errorMessage && (
        <p className="text-red-600 text-sm mt-2">{errorMessage}</p>
      )}

      <p
        className="underlined-text cursor-pointer mt-2"
        onClick={onSwitchToForgot}
      >
        Forgot password?
      </p>
    </form>
  );
}
