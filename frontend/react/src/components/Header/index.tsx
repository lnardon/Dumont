import { useEffect, useState, useRef } from "react";
import AnimatedText from "animated-text-letters";
import "animated-text-letters/index.css";
import styles from "./styles.module.css";
import { Boxes, Container, Plus } from "lucide-react";

interface HeaderProps {
  handleCreate: React.Dispatch<React.SetStateAction<string>>;
}

export default function Header({ handleCreate }: HeaderProps) {
  const [time, setTime] = useState<string>("");
  const [popupVisible, setPopupVisible] = useState<boolean>(false);

  const iconRef = useRef<SVGSVGElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  function getCurrentTime() {
    const today = new Date();
    const time =
      (today.getHours() < 10 ? "0" : "") +
      today.getHours() +
      ":" +
      (today.getMinutes() < 10 ? "0" : "") +
      today.getMinutes();
    return time;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getCurrentTime();
      setTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.addEventListener("click", (e) => {
      if (
        e.target !== document.querySelector(`.${styles.button}`) &&
        popupVisible
      ) {
        setPopupVisible(false);
      }
    });

    if (popupVisible) {
      iconRef.current?.style.setProperty("transform", "rotate(45deg)");
      iconRef.current?.style.setProperty("color", "red");
      popupRef.current?.style.setProperty(
        "border-radius",
        "0.5rem 0rem 0.5rem 0.5rem"
      );
      createButtonRef.current?.style.setProperty(
        "border-radius",
        "0.25rem 0.25rem 0rem 0rem"
      );
      createButtonRef.current?.blur();
    } else {
      iconRef.current?.style.setProperty("transform", "rotate(0deg)");
      iconRef.current?.style.setProperty("color", "black");
      popupRef.current?.style.setProperty("border-radius", "0.25rem");
      createButtonRef.current?.style.setProperty("border-radius", "0.25rem");
    }

    return () => {
      document.removeEventListener("click", (e) => {
        if (
          e.target !== document.querySelector(`.${styles.button}`) &&
          popupVisible
        ) {
          setPopupVisible(false);
        }
      });
    };
  }, [popupVisible]);

  return (
    <div className={styles.container}>
      <img className={styles.logo} src="/assets/dumont_logo.png" alt="Logo" />
      <span className={styles.time}>
        <AnimatedText
          text={time}
          transitionOnlyDifferentLetters={true}
          animation="fade-in"
          delay={48}
          animationDuration={600}
          easing="ease"
        />
      </span>
      <button
        className={styles.button}
        onClick={() => setPopupVisible((old) => !old)}
        ref={createButtonRef}
      >
        <Plus
          onClick={(e) => {
            e.stopPropagation();
            setPopupVisible((old) => !old);
          }}
          ref={iconRef}
          strokeWidth={2.5}
          width={28}
          style={{
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </button>

      {popupVisible && (
        <div className={styles.popup} ref={popupRef}>
          <button
            className={styles.btn}
            onClick={() => handleCreate("createContainer")}
            style={{
              background: "#646cff",
            }}
          >
            <Container strokeWidth={1.5} />
            Container
          </button>
          <button
            className={styles.btn}
            onClick={() => handleCreate("createContainerGroup")}
            style={{
              background: "rgb(15, 113, 226)",
            }}
          >
            <Boxes strokeWidth={1.5} />
            Container Group
          </button>
        </div>
      )}
    </div>
  );
}
