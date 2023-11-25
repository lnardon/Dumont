import styles from "./styles.module.css";

interface ContainerCardProps {
  name: string;
  status: string;
  ports: string;
  createdAt: string;
  id: string;
  handleDelete: (containerId: string) => void;
  handleOpen: (containerPort: string) => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  name,
  status,
  ports,
  // createdAt,
  id,
  handleDelete,
  handleOpen,
}) => {
  return (
    <div className={styles.container}>
      <h3>{name}</h3>
      <p>{status}</p>
      <p>{ports.split(",")[0]}</p>
      {/* <p>{createdAt}</p> */}
      <button
        className={styles.deleteBtn}
        onClick={() => handleOpen(ports.split(":")[1].split("->")[0])}
      >
        Open
      </button>
      <button className={styles.deleteBtn} onClick={() => handleDelete(id)}>
        X
      </button>
    </div>
  );
};

export default ContainerCard;
