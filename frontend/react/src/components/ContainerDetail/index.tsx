import { useState } from "react";
import styles from "./styles.module.css";
import { apiHandler } from "../../utils/apiHandler";
import LoaderGif from "/assets/loader.gif";
import Terminal from "../Terminal";
import Logs from "../Logs";

interface Props {
  handleClose: () => void;
  containerName: string;
  containerImage: string;
  containerStatus: string;
  containerPorts: string;
  containerId: string;
  containerNetwork: string;
  createdAt: number;
}

const ContainerDetail: React.FC<Props> = ({
  handleClose,
  containerName,
  containerImage,
  containerNetwork,
  containerStatus,
  containerPorts,
  createdAt,
  containerId,
}) => {
  const amount = 50;
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading");
  const [isContainerRunning, setIsContainerRunning] = useState(
    containerStatus.includes("Up")
  );
  const [showTerminal, setShowTerminal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  async function handleDelete() {
    setMessage("Deleting container");
    setIsLoading(true);
    const response = await apiHandler(
      "/deleteContainer",
      "POST",
      "application/json",
      {
        container_id: containerId,
      }
    );

    if (response.status === 200) {
      alert("Container deleted");
    } else {
      alert("Error deleting container");
    }
    setIsContainerRunning(false);
    window.location.reload();
  }

  async function handleStop() {
    setMessage("Stopping container");
    setIsLoading(true);
    const response = await apiHandler(
      "/stopContainer",
      "POST",
      "application/json",
      {
        container_id: containerId,
      }
    );

    if (response.status === 200) {
      alert("Container stopped");
    } else {
      alert("Error stopping container");
    }
    window.location.reload();
  }

  async function handleStart() {
    setMessage("Starting container");
    setIsLoading(true);
    const response = await apiHandler(
      "/runContainer",
      "POST",
      "application/json",
      {
        container_id: containerId,
      }
    );

    if (response.status === 200) {
      alert("Container started");
    } else {
      alert("Error starting container");
    }
    window.location.reload();
  }

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loaderContainer}>
          <h2 className={styles.loadingText}>{message}</h2>
          <img className={styles.loader} src={LoaderGif} alt="Loader" />
        </div>
      ) : (
        <>
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
              <p className={styles.infoTitle}>Created:</p>
              <p className={styles.infoText}>
                {new Date(createdAt * 1000).toUTCString()}
              </p>
            </div>
          </div>
          {showTerminal && <Terminal containerId={containerId} />}
          {showLogs && <Logs containerId={containerId} />}

          <div className={styles.buttons}>
            {isContainerRunning ? (
              <>
                <button
                  className={styles.button}
                  onClick={() => {
                    window.open(
                      `${window.location.protocol}//${
                        window.location.hostname
                      }:${containerPorts.split(":")[0]}`,
                      "_blank"
                    );
                  }}
                >
                  Open
                </button>
                <button onClick={handleStop} className={styles.button}>
                  Stop
                </button>
                <button
                  onClick={() => setShowTerminal(!showTerminal)}
                  className={styles.button + " " + styles.deleteBtn}
                >
                  Terminal
                </button>
              </>
            ) : (
              <button onClick={handleStart} className={styles.button}>
                Start
              </button>
            )}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={styles.button}
            >
              View Logs
            </button>
            <button
              onClick={handleDelete}
              className={styles.button + " " + styles.deleteBtn}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ContainerDetail;
