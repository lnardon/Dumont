import styles from "./styles.module.css";

export default function Header() {
  return (
    <div className={styles.container}>
      <h1>Dumont</h1>
      <button className={styles.button}>Create | +</button>
    </div>
  );
}
