import { useState } from "react";
import styles from "./styles.module.css";
import { apiHandler } from "../../utils/apiHandler";
import LoaderGif from "/assets/loader.gif";
import ResourceUsage from "../ResourceUsage";
import Terminal from "../Terminal";
import Logs from "../Logs";
import { toast } from "react-toastify";

interface Props {
  handleClose: () => void;
  containerName: string;
  containerImage: string;
  containerStatus: string;
  containerPorts: any[];
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
  const [willClose, setWillClose] = useState(false);
  const [willTerminalClose, setWillTerminalClose] = useState(false);

  async function handleDelete() {
    const response = await toast.promise(
      apiHandler("/deleteContainer", "POST", "application/json", {
        container_id: containerId,
      }),
      {
        success: "Container deleted!",
        error: "Error deleting container 😢",
      }
    );
    if (response.status === 200) {
      setIsContainerRunning(false);
      handleClose();
    }
  }

  async function handleStop() {
    setMessage("Stopping container");
    setIsLoading(true);
    const response = await toast.promise(
      apiHandler("/stopContainer", "POST", "application/json", {
        container_id: containerId,
      }),
      {
        success: "Container stopped!",
        error: "Error stopping container 😢",
      }
    );
    if (response.status === 200) {
      setIsContainerRunning(false);
    }
    setIsLoading(false);
  }

  async function handleStart() {
    setMessage("Starting container");
    setIsLoading(true);
    const response = await toast.promise(
      apiHandler("/runContainer", "POST", "application/json", {
        container_id: containerId,
      }),
      {
        success: "Container started!",
        error: "Error starting container 😢",
      }
    );
    if (response.status === 200) {
      setIsContainerRunning(true);
    }
    setIsLoading(false);
  }

  function handleCloseAnim(component: string) {
    const currentState = component === "terminal" ? showTerminal : showLogs;
    if (currentState) {
      if (component === "terminal") {
        setWillTerminalClose(true);
      } else {
        setWillClose(true);
      }
      setTimeout(() => {
        if (component === "terminal") {
          setShowTerminal(!showTerminal);
          setWillTerminalClose(false);
        } else {
          setShowLogs(!showLogs);
        }
        setWillClose(false);
      }, 750);
    } else {
      if (component === "terminal") {
        setShowTerminal(!showTerminal);
      } else {
        setShowLogs(!showLogs);
      }
    }
  }

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: isContainerRunning ? "#646cff" : "#646cff7f",
        border: isContainerRunning
          ? "0.25rem solid transparent"
          : "0.25rem solid #646cff",
      }}
    >
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
            <div style={{ minWidth: "100%" }}>
              <ResourceUsage containerId={containerId} />
            </div>
            <div className={styles.infoField}>
              <p className={styles.infoTitle}>ID:</p>
              <p className={styles.infoText}>{containerId}</p>
            </div>
            <div
              className={styles.infoField}
              style={{ animationDelay: 2 * amount + "ms" }}
            >
              <p className={styles.infoTitle}>Ports:</p>
              {containerPorts.map((port, index) => {
                return port.PublicPort && port.IP !== "::" ? (
                  <p
                    key={index}
                    className={styles.port}
                    onClick={() => {
                      window.open(
                        `${window.location.protocol}//${window.location.hostname}:${port.PublicPort}`,
                        "_blank"
                      );
                    }}
                  >
                    {port.IP
                      ? port.IP + ":" + port.PublicPort
                      : port.PrivatePort}
                  </p>
                ) : null;
              })}
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
          {showTerminal && (
            <Terminal containerId={containerId} willClose={willTerminalClose} />
          )}
          {showLogs && <Logs containerId={containerId} willClose={willClose} />}

          <div className={styles.buttons}>
            {isContainerRunning ? (
              <>
                <button onClick={handleStop} className={styles.button}>
                  Stop
                </button>
                <button
                  onClick={() => handleCloseAnim("terminal")}
                  className={styles.button + " " + styles.deleteBtn}
                >
                  {showTerminal ? "Hide terminal" : "Show terminal"}
                </button>
              </>
            ) : (
              <button onClick={handleStart} className={styles.button}>
                Start
              </button>
            )}
            <button
              onClick={() => handleCloseAnim("logs")}
              className={styles.button}
            >
              {showLogs ? "Hide logs" : "Show logs"}
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
