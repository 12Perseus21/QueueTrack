import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
}

export default function Login({ onSwitchToSignup, onSwitchToForgot }: LoginProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "student") navigate("/student");
        if (profile?.role === "staff") navigate("/staff");
        if (profile?.role === "admin") navigate("/staff");
      }
    };

    checkUser();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    // Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMessage("Something went wrong.");
      setLoading(false);
      return;
    }

    // Fetch user profile + role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile?.role === "student") {
      navigate("/student");
    } else if (profile?.role === "staff") {
      navigate("/staff");
    } else if (profile?.role === "admin") {
      console.log("admin login");
      navigate("/staff");
    } else if (!profile) {
      setErrorMessage("Unable to fetch profile. Contact admin.");
      return;
    } else {
      setErrorMessage("No role assigned. Contact admin.");
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="w-full h-full flex flex-col items-center lg:items-center lg:justify-center "
    >
      <h2 className="font-bold text-[24px] mt-5">Login Account</h2>
      <h3 className="text-[14px] text-center w-[330px] text-secondary">
        Dont have an account yet?
        <span className="underlined-text" onClick={onSwitchToSignup}>
          {" "}
          Sign up here
        </span>
      </h3>

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

      {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

      <p
        className="underlined-text"
        onClick={onSwitchToForgot}
      >
        Forgot password?
      </p>
    </form>
  );
}
