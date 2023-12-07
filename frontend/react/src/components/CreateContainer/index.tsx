import { useState } from "react";
import styles from "./styles.module.css";
import LoaderGif from "/assets/loader.gif";
import { apiHandler } from "../../utils/apiHandler";

type Props = {
  handleClose: () => void;
};

function CreateContainer({ handleClose }: Props) {
  const delay = 40;
  const [isLoading, setIsLoading] = useState(false);
  const [imageName, setImageName] = useState("");
  const [ports, setPorts] = useState("");
  const [containerName, setContainerName] = useState("");
  const [volume, setvolume] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [isCloneField, setIsCloneField] = useState(false);
  const [restartPolicy, setRestartPolicy] = useState("no");

  async function sendRepoLink() {
    if (!repoLink || !ports) {
      alert("No valid repo link and port provided.");
      return;
    }

    const response = await apiHandler("/cloneRepo", "POST", "", {
      repo_url: repoLink,
      container_port: ports,
      containerName: containerName.replace(" ", ""),
      restart_policy: restartPolicy,
    });

    if (response.status === 200 || response.status === 201) {
      alert("Project cloned and started");
    } else {
      alert("Error cloning and stating project");
    }
    window.location.reload();
  }

  async function create() {
    setIsLoading(true);
    if (!containerName || !ports || !imageName) {
      alert("No valid container name, port or image provided.");
      setIsLoading(false);
      return;
    }

    const response = await apiHandler("/createContainer", "POST", "", {
      container_name: containerName.replace(" ", ""),
      ports: ports,
      image: imageName,
      volume: volume,
      restart_policy: restartPolicy,
    });

    if (response.status === 201 || response.status === 200) {
      alert("Container created");
    } else {
      alert("Error creating container");
    }
    window.location.reload();
  }

  return (
    <div className={styles.container}>
      {isLoading ? (
        <>
          <img className={styles.loader} src={LoaderGif} alt="Loader" />
          <h2 className={styles.loadingText}>Creating</h2>
        </>
      ) : (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>Create container</h1>
            <button onClick={handleClose} className={styles.closeBtn}>
              X
            </button>
          </div>
          <div className={styles.fields}>
            {!isCloneField ? (
              <div
                className={styles.field}
                style={{ animationDelay: 0 * delay + "ms" }}
              >
                <label className={styles.name}>Image name:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="nginx"
                />
              </div>
            ) : (
              <div
                className={styles.field}
                style={{ animationDelay: 1 * delay + "ms" }}
              >
                <label className={styles.name}>Repository url:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={repoLink}
                  onChange={(e) => setRepoLink(e.target.value)}
                  placeholder="https://github.com/lnardon/Dumont.git"
                />
              </div>
            )}
            <div
              className={styles.field}
              style={{ animationDelay: 2 * delay + "ms" }}
            >
              <label className={styles.name}>Port:</label>
              <input
                type="text"
                className={styles.input}
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                placeholder="3000:80"
              />
            </div>
            <div
              className={styles.field}
              style={{ animationDelay: 3 * delay + "ms" }}
            >
              <label className={styles.name}>Container name:</label>
              <input
                type="text"
                className={styles.input}
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="Dumont"
              />
            </div>
            <div
              className={styles.field}
              style={{ animationDelay: 4 * delay + "ms" }}
            >
              <label className={styles.name}>Volume:</label>
              <input
                type="text"
                className={styles.input}
                value={volume}
                onChange={(e) => setvolume(e.target.value)}
                placeholder="/app:/app/container (optional)"
              />
            </div>
            <div
              className={styles.field}
              style={{ animationDelay: 4 * delay + "ms" }}
            >
              <label className={styles.name}>Restart Policy:</label>
              <select
                className={styles.select}
                onChange={(e) => setRestartPolicy(e.target.value)}
              >
                <option value="no" selected className={styles.option}>
                  No (optional)
                </option>
                <option className={styles.option} value="always">
                  Always
                </option>
                <option className={styles.option} value="unless-stopped">
                  Unless stopped
                </option>
                <option className={styles.option} value="on-failure">
                  On Failure
                </option>
              </select>
            </div>
          </div>
          <div className={styles.buttons}>
            <button
              onClick={() => setIsCloneField((old) => !old)}
              className={styles.cloneBtn}
            >
              {isCloneField ? "Create from image" : "Create from repository"}
            </button>
            <button
              onClick={!isCloneField ? create : sendRepoLink}
              className={styles.createBtn}
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CreateContainer;
