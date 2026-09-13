import { useState } from "react";
import styles from "./styles.module.css";
import Logo from "/assets/dumont_logo.png";
import LoaderGif from "/assets/loader.gif";
import { toast } from "react-toastify";

const Setup: React.FC<{ onSetupComplete: () => void }> = ({
  onSetupComplete,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSetup() {
    if (username.trim() === "") {
      toast.error("Username is required");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const raw = await fetch("/api/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        confirm_password: confirmPassword,
      }),
    });

    if (raw.status === 409) {
      toast.error("Setup has already been completed");
      setIsLoading(false);
      return;
    }
    if (raw.status !== 201) {
      toast.error("Setup failed!");
      setIsLoading(false);
      return;
    }

    const token = await raw.text();
    sessionStorage.setItem("token", token);
    onSetupComplete();
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <h2 className={styles.loadingText}>Creating your account</h2>
            <img className={styles.loader} src={LoaderGif} alt="Loader" />
          </div>
        ) : (
          <>
            <img src={Logo} alt="Logo" className={styles.logo} />
            <h1 className={styles.title}>Dumont</h1>
            <p className={styles.subtitle}>
              Create the admin account used to sign in from now on.
            </p>
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
              <div className={styles.fieldContainer}>
                <input
                  type="password"
                  placeholder="Confirm password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  className={styles.input}
                />
              </div>
            </div>
            <button onClick={handleSetup} className={styles.button}>
              Create account
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Setup;
