import { useState } from "react";
import styles from "./styles.module.css";
import LoaderGif from "/assets/loader.gif";
import { apiHandler } from "../../utils/apiHandler";
import { toast } from "react-toastify";

type Props = {
  handleClose: () => void;
};

function CreateContainer({ handleClose }: Props) {
  const delay = 40;
  const [isLoading, setIsLoading] = useState(false);
  const [imageName, setImageName] = useState("");
  const [ports, setPorts] = useState("");
  const [containerName, setContainerName] = useState("");
  const [volumes, setvolumes] = useState("");
  const [variables, setVariable] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [isCloneField, setIsCloneField] = useState(false);
  const [restartPolicy, setRestartPolicy] = useState("no");

  async function sendRepoLink() {
    if (!repoLink || !ports) {
      toast.warning("No valid repo link and port provided.");
      return;
    }

    const response = await apiHandler("/cloneRepo", "POST", "", {
      repo_url: repoLink,
      container_port: ports,
      containerName: containerName.replace(" ", ""),
      restart_policy: restartPolicy,
    });

    if (response.status === 201 || response.status === 200) {
      toast.success("Container created! 🎉");
    } else {
      toast.error("Error creating container 😢");
    }
  }

  async function create() {
    setIsLoading(true);
    if (!containerName || !ports || !imageName) {
      toast.warning("No valid container name, port or image provided.");
      setIsLoading(false);
      return;
    }

    const response = await toast.promise(
      apiHandler("/createContainer", "POST", "", {
        container_name: containerName.replace(" ", ""),
        ports: ports,
        image: imageName,
        volumes: volumes.trim().split(/\s*;\s*/),
        restart_policy: restartPolicy,
        variables: variables.trim().split(/\s*;\s*/),
      }),
      {
        success: "Container created! 🎉",
        error: "Error creating container 😢",
      }
    );

    if (response.status === 201 || response.status === 200) {
      handleClose();
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loaderContainer}>
          <h2 className={styles.loadingText}>Creating container</h2>
          <img className={styles.loader} src={LoaderGif} alt="Loader" />
        </div>
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
                <label className={styles.name}>Image name: *</label>
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
                <label className={styles.name}>Repository url: *</label>
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
              <label className={styles.name}>Port: *</label>
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
              <label className={styles.name}>Container name: *</label>
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
                value={volumes}
                onChange={(e) => setvolumes(e.target.value)}
                placeholder="/app:/app/container (optional)"
              />
            </div>
            <div
              className={styles.field}
              style={{ animationDelay: 5 * delay + "ms" }}
            >
              <label className={styles.name}>Restart policy:</label>
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
          <div
            className={styles.variables}
            style={{ animationDelay: 6 * delay + "ms" }}
          >
            <label className={styles.name}>Environment variables:</label>
            <input
              type="text"
              className={styles.input}
              value={variables}
              onChange={(e) => setVariable(e.target.value)}
              placeholder="DATABASE_URL=postgres://user:pass@localhost:5432/db ; PORT=3000 (Optional)"
            />
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
