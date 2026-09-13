import { useEffect, useState } from "react";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import Login from "./views/Login";
import Setup from "./views/Setup";
import Dashboard from "./views/Dashboard";

function App() {
  const [isUserLogged, setIsUserLogged] = useState(
    sessionStorage.getItem("token") ? true : false
  );
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/setup_status")
      .then((raw) => raw.json())
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(true));
  }, []);

  return (
    <div className="container">
      {isUserLogged ? (
        <Dashboard />
      ) : isConfigured === null ? null : isConfigured === false ? (
        <Setup onSetupComplete={() => setIsUserLogged(true)} />
      ) : (
        <Login onLogin={() => setIsUserLogged(true)} />
      )}
      <ToastContainer theme="dark" transition={Slide} />
    </div>
  );
}

export default App;
