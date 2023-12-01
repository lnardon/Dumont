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
      style={{ animationDelay: index * 42 + "ms" }}
    >
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.status}>{status}</p>
    </div>
  );
};

export default ContainerCard;
