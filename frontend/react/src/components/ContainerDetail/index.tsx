import { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  handleClose: () => void;
  containerName: string;
  containerImage: string;
  containerStatus: string;
  containerPorts: string;
  containerId: string;
  containerNetwork: string;
  containerSize: string;
}

const ContainerDetail: React.FC<Props> = ({
  handleClose,
  containerName,
  containerImage,
  containerNetwork,
  containerStatus,
  containerPorts,
  containerSize,
  containerId,
}) => {
  const amount = 50;
  const [isContainerRunning, setIsContainerRunning] = useState(
    containerStatus.includes("Up")
  );

  function handleDelete() {
    fetch("/deleteContainer", {
      method: "POST",
      body: JSON.stringify({ container_id: containerId }),
    }).then((res) => {
      if (res.status === 200) {
        alert("Container deleted");
      } else {
        alert("Error deleting container");
      }
      setIsContainerRunning(false);
      window.location.reload();
    });
  }

  function handleStop() {
    fetch("/stopContainer", {
      method: "POST",
      body: JSON.stringify({ container_id: containerId }),
    }).then((res) => {
      if (res.status === 200) {
        alert("Container stopped");
      } else {
        alert("Error stopping container");
      }
      window.location.reload();
    });
  }

  function handleStart() {
    fetch("/runContainer", {
      method: "POST",
      body: JSON.stringify({ container_id: containerId }),
    }).then((res) => {
      if (res.status === 200) {
        alert("Container started");
      } else {
        alert("Error starting container");
      }
      window.location.reload();
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{containerName}</h1>
        <button onClick={handleClose} className={styles.closeBtn}>
          X
        </button>
      </div>
      <div
        className={styles.infoContainer}
        style={{ animationDelay: 1 * amount + "ms" }}
      >
        <div className={styles.infoField}>
          <p className={styles.infoTitle}>ID:</p>
          <p className={styles.infoText}>{containerId}</p>
        </div>
        <div
          className={styles.infoField}
          style={{ animationDelay: 2 * amount + "ms" }}
        >
          <p className={styles.infoTitle}>Ports:</p>
          <p className={styles.infoText}>{containerPorts}</p>
        </div>
        <div
          className={styles.infoField}
          style={{ animationDelay: 3 * amount + "ms" }}
        >
          <p className={styles.infoTitle}>Status:</p>
          <p className={styles.infoText}>{containerStatus}</p>
        </div>
        <div
          className={styles.infoField}
          style={{ animationDelay: 4 * amount + "ms" }}
        >
          <p className={styles.infoTitle}>Image:</p>
          <p className={styles.infoText}>{containerImage}</p>
        </div>
        <div
          className={styles.infoField}
          style={{ animationDelay: 5 * amount + "ms" }}
        >
          <p className={styles.infoTitle}>Networks:</p>
          <p className={styles.infoText}>{containerNetwork}</p>
        </div>
        <div
          className={styles.infoField}
          style={{ animationDelay: 6 * amount + "ms" }}
        >
          <p className={styles.infoTitle}>Size:</p>
          <p className={styles.infoText}>{containerSize}</p>
        </div>
      </div>
      <div className={styles.buttons}>
        {isContainerRunning ? (
          <>
            <button
              onClick={() => {
                window.open(
                  `${window.location.protocol}//${window.location.hostname}:${
                    containerPorts.split(":")[1].split("->")[0]
                  }`,
                  "_blank"
                );
              }}
            >
              Open Service
            </button>
            <button onClick={handleStop}>Stop</button>
          </>
        ) : (
          <button onClick={handleStart}>Start</button>
        )}
        <button onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
};

export default ContainerDetail;
