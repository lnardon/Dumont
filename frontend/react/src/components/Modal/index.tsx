import { useEffect, useRef, useCallback } from "react";
import CloseIcon from "/assets/close.png";
import styles from "./styles.module.css";

interface ModalProps {
  renderComponent: React.ReactNode;
  setIsOpen: (state: boolean) => void;
}

export default function Modal({ renderComponent, setIsOpen }: ModalProps) {
  const backDropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (backDropRef.current && contentRef.current) {
      backDropRef.current.classList.remove(styles.backdropIn);
      backDropRef.current.classList.add(styles.backdropOut);
      contentRef.current.classList.remove(styles.contentIn);
      contentRef.current.classList.add(styles.contentOut);
      setTimeout(() => {
        setIsOpen(false);
      }, 250);
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
      <div
        className={styles.backdrop + " " + styles.backdropIn}
        ref={backDropRef}
      >
        <div className={styles.content} ref={contentRef}>
          <img
            src={CloseIcon}
            alt="Close icon"
            className={styles.closeBtn}
            onClick={handleClose}
          />
          {renderComponent}
        </div>
      </div>
    </div>
  );
}
