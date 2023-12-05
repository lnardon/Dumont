import { useState } from "react";
import styles from "./styles.module.css";
import Logo from "/assets/dumont_logo.png";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    // fetch("/login", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     username,
    //     password,
    //   }),
    // }).then((parsed) => {
    //   parsed.json().then((data) => {
    //     console.log(data);
    //   });
    // });
    sessionStorage.setItem("jwt", "123");
  }

  return (
    <div className={styles.container}>
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
  );
};

export default Login;