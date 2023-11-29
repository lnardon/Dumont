import styles from "./styles.module.css";

interface ContainerCardProps {
  name: string;
  // status: string;
  ports: string;
  createdAt: string;
  id: string;
  handleOpen: (containerPort: string) => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  name,
  // status,
  ports,
  // id,
  handleOpen,
}) => {
  return (
    <div
      className={styles.container}
      onClick={() => handleOpen(ports.split(":")[1].split("->")[0])}
    >
      <h3 className={styles.name}>{name}</h3>
      {/* <p>{status}</p> */}
      <p className={styles.ports}>{ports.split(",")[0]}</p>
    </div>
  );
};

export default ContainerCard;
