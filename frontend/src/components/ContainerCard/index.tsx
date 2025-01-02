import styles from "./styles.module.css";

interface ContainerCardProps {
  name: string;
  status: string;
  index: number;
  handleOpen: () => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  name,
  status,
  index,
  handleOpen,
}) => {
  return (
    <div
      className={styles.container}
      onClick={() => handleOpen()}
      style={{
        animationDelay: index * 50 + "ms",
        backgroundColor: status.includes("Up")
          ? "var(--secondary-color)"
          : "rgba(100, 108, 255, 0.24)",
        border: status.includes("Up")
          ? "4px solid transparent"
          : "4px solid rgb(100, 108, 255)",
      }}
    >
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.status}>{status}</p>
    </div>
  );
};

export default ContainerCard;
