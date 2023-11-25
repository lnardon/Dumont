import styles from "./styles.module.css";

interface NavBarProps {
  handleCloneRepo: () => void;
  handleCreate: () => void;
}

export default function NavBar({ handleCloneRepo, handleCreate }: NavBarProps) {
  return (
    <div className={styles.container}>
      <button onClick={() => {}} className={styles.nav_button}>
        Home
      </button>
      <button onClick={handleCloneRepo} className={styles.nav_button}>
        Clone Repo
      </button>
      <button onClick={handleCreate} className={styles.nav_button}>
        Create
      </button>
    </div>
  );
}
