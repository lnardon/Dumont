import { useState } from "react";
import styles from "./styles.module.css";
import LoaderGif from "/assets/loader.gif";

const CreateContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageName, setImageName] = useState("");
  const [ports, setPorts] = useState("");
  const [containerName, setContainerName] = useState("");
  const [volume, setvolume] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [isCloneField, setIsCloneField] = useState(false);

  function sendRepoLink() {
    if (!repoLink || !ports) {
      alert("No valid repo link and port provided.");
      return;
    }

    fetch("/cloneRepo", {
      method: "POST",
      body: JSON.stringify({
        repo_url: repoLink,
        container_port: ports,
        containerName: containerName.replace(" ", ""),
      }),
    }).then((res) => {
      if (res.status === 200 || res.status === 201) {
        alert("Project cloned and started");
      } else {
        alert("Error cloning and stating project");
      }
      window.location.reload();
    });
  }

  function create() {
    setIsLoading(true);
    if (!containerName || !ports || !imageName) {
      alert("No valid container name, port or image provided.");
      setIsLoading(false);
      return;
    }

    fetch("/createContainer", {
      method: "POST",
      body: JSON.stringify({
        container_name: containerName.replace(" ", ""),
        ports: ports,
        image: imageName,
        volume: volume,
      }),
    }).then((res) => {
      if (res.status === 201 || res.status === 200) {
        alert("Container created");
      } else {
        alert("Error creating container:" + res);
      }
      window.location.reload();
      setIsLoading(false);
    });
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
          <h1 className={styles.title}>Create</h1>
          <div className={styles.fields}>
            {!isCloneField ? (
              <div className={styles.field}>
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
              <div className={styles.field}>
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
            <div className={styles.field}>
              <label className={styles.name}>Port:</label>
              <input
                type="text"
                className={styles.input}
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                placeholder="3000:80"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.name}>Container name:</label>
              <input
                type="text"
                className={styles.input}
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="Dumont"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.name}>Volume:</label>
              <input
                type="text"
                className={styles.input}
                value={volume}
                onChange={(e) => setvolume(e.target.value)}
                placeholder="/app:/app/container (optional)"
              />
            </div>
          </div>

          <button
            onClick={!isCloneField ? create : sendRepoLink}
            className={styles.createBtn}
          >
            Done
          </button>
          <button
            onClick={() => setIsCloneField((old) => !old)}
            className={styles.cloneBtn}
          >
            {isCloneField ? "Create from image" : "Create from repository"}
          </button>
        </>
      )}
    </div>
  );
};

export default CreateContainer;
