import { useEffect } from "react";
import styles from "./styles.module.css";

interface HeaderProps {
  handleCreate: () => void;
}

export default function Header({ handleCreate }: HeaderProps) {
  function getCurrentTime() {
    const today = new Date();
    const time =
      (today.getHours() < 10 ? "0" : "") +
      today.getHours() +
      ":" +
      (today.getMinutes() < 10 ? "0" : "") +
      today.getMinutes() +
      ":" +
      (today.getSeconds() < 10 ? "0" : "") +
      today.getSeconds();
    return time;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getCurrentTime();
      document.querySelector("span")!.innerText = time;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <img className={styles.logo} src="/assets/dumont_logo.png" alt="" />
      <span>{getCurrentTime()}</span>
      <button className={styles.button} onClick={handleCreate}>
        Create +
      </button>
    </div>
  );
}
