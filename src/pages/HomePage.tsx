import { useState } from "react";

import heroImg from "../assets/heroImg.svg";
import Login from "../components/layouts/Login";
import SignUp from "../components/layouts/SignUp";
import ForgotPassword from "../components/layouts/ForgotPassword";

export default function HomePage() {
  const [currentView, setCurrentView] = useState("login");

  return (
    <div className="min-h-screen w-full lg:flex lg:justify-center lg:items-center bg-[#fafafa]">
      <div className="w-full min-h-screen flex flex-col lg:flex-row bg-brand lg:bg-white lg:min-h-0 lg:w-[1200px] lg:h-[800px] lg:shadow-lg lg:rounded-[12px]">
        <section className=" h-[350px] w-full bg-brand flex flex-col justify-center items-center lg:h-full lg:w-7/12 lg:rounded-l-[12px]">
          <h1 className="font-extrabold text-[26px] w-[300px] text-center lg:text-[32px] lg:w-[400px]">
            Efficient queuing, seamless tracking
          </h1>
          <img
            src={heroImg}
            alt="queue image"
            className="h-[180px] lg:h-[350px]"
          />
        </section>

        <section className="flex-1 flex flex-col items-center w-full bg-white rounded-t-[30px] shadow-[0_-3px_8px_rgba(0,0,0,0.1)] lg:h-full lg:w-6/12 lg:rounded-t-none lg:rounded-r-[12px] lg:shadow-none">
          {currentView === "login" && (
            <Login
              onSwitchToSignup={() => setCurrentView("signup")}
              onSwitchToForgot={() => setCurrentView("forgot")}
            />
          )}

          {currentView === "signup" && (
            <SignUp onSwitchToLogin={() => setCurrentView("login")} />
          )}

          {currentView === "forgot" && (
            <ForgotPassword onSwitchToLogin={() => setCurrentView("login")} />
          )}
        </section>
      </div>
    </div>
  );
}
