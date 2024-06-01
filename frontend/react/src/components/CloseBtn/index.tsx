import { X } from "lucide-react";
import styles from "./styles.module.css";

const CloseBtn = ({ handleClose }: { handleClose: () => void }) => {
  return (
    <button onClick={handleClose} className={styles.closeBtn}>
      <X width={44} strokeWidth={3} color="white" />
    </button>
  );
};

export default CloseBtn;
