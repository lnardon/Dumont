import { useEffect, useState } from "react";
import AnimatedText from "animated-text-letters";
import "animated-text-letters/dist/index.css";
import styles from "./styles.module.css";

interface HeaderProps {
  handleCreate: () => void;
}

export default function Header({ handleCreate }: HeaderProps) {
  const [time, setTime] = useState<string>("");

  function getCurrentTime() {
    const today = new Date();
    const time =
      (today.getHours() < 10 ? "0" : "") +
      today.getHours() +
      ":" +
      (today.getMinutes() < 10 ? "0" : "") +
      today.getMinutes() +
      ":00";
    return time;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getCurrentTime();
      setTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <img className={styles.logo} src="/assets/dumont_logo.png" alt="Logo" />
      <span className={styles.time}>
        <AnimatedText
          text={time}
          animateOnlyDifferentLetters={true}
          animation="fade-in"
          delay={48}
        />
      </span>
      <button className={styles.button} onClick={handleCreate}>
        +
      </button>
    </div>
  );
}
