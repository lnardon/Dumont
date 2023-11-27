import styles from "./styles.module.css";

const CreateContainer: React.FC = () => {
  function sendRepoLink() {
    const repoLink = prompt("Enter the repo link:");
    const containerPort = prompt("Enter the port you want to use:");

    if (!repoLink || !containerPort) {
      alert("No valid repo link and port provided.");
      return;
    }

    fetch("/cloneRepo", {
      method: "POST",
      body: JSON.stringify({
        repo_url: repoLink,
        container_port: containerPort,
      }),
    }).then((res) => {
      if (res.status === 201) {
        alert("Project cloned and started");
      } else {
        alert("Error cloning and stating project");
      }
      window.location.reload();
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create</h1>
      <button onClick={sendRepoLink} className={styles.cloneBtn}>
        Clone and deploy from url
      </button>
    </div>
  );
};

export default CreateContainer;
