import { useEffect, useRef, useCallback } from "react";
import styles from "./styles.module.css";

interface ModalProps {
  renderComponent: React.ReactNode;
  setIsOpen: (state: boolean) => void;
}

export default function Modal({ renderComponent, setIsOpen }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (ref.current) {
      ref.current.classList.remove(styles.backdropIn);
      ref.current.classList.add(styles.backdropOut);
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    }
  }, [setIsOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  return (
    <div className={styles.container}>
      <div className={styles.backdrop + " " + styles.backdropIn} ref={ref}>
        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={handleClose}>
            X
          </button>
          {renderComponent}
        </div>
      </div>
    </div>
  );
}
