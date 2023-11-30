// import { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  handleClose: () => void;
  containerName: string;
  containerImage: string;
  containerStatus: string;
  containerStarted: string;
  containerPorts: string;
  containerId: string;
}

const ContainerDetail: React.FC<Props> = ({
  handleClose,
  containerName,
  containerImage,
  containerStarted,
  containerStatus,
  containerPorts,
  containerId,
}) => {
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
      <div className={styles.infoContainer}>
        <p>ID: {containerId}</p>
        <p>Ports: {containerPorts}</p>
        <p>Image: {containerImage}</p>
        <p>Status: {containerStatus}</p>
        <p>Started: {containerStarted}</p>
      </div>
      <div className={styles.buttons}>
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
        <button
          onClick={handleDelete}
          style={{
            border: "0.25rem solid red",
          }}
        >
          Delete Container
        </button>
      </div>
    </div>
  );
};

export default ContainerDetail;
