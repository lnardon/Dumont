import { useState } from "react";
import styles from "./styles.module.css";
import Logo from "/assets/dumont_logo.png";
import { toast } from "react-toastify";

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const raw = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (raw.status !== 200) {
      toast.error("Login failed!");
      return;
    }
    const token = await raw.text();
    sessionStorage.setItem("token", token);
    onLogin();
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img src={Logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>Dumont</h1>
        <div className={styles.inputs}>
          <div className={styles.fieldContainer}>
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              className={styles.input}
            />
          </div>
          <div className={styles.fieldContainer}>
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className={styles.input}
            />
          </div>
        </div>
        <button onClick={handleLogin} className={styles.button}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
