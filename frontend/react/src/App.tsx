import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import Login from "./views/Login";
import Dashboard from "./views/Dashboard";

function App() {
  const [isUserLogged, setIsUserLogged] = useState(
    sessionStorage.getItem("token") ? true : false
  );

  return (
    <div className="container">
      {isUserLogged ? (
        <Dashboard />
      ) : (
        <Login onLogin={() => setIsUserLogged(true)} />
      )}
      <ToastContainer theme="dark" />
    </div>
  );
}

export default App;
