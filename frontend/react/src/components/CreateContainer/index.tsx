import styles from "./styles.module.css";
// import { fields } from "./fields";

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
      if (res.status === 200 || res.status === 201) {
        alert("Project cloned and started");
      } else {
        alert("Error cloning and stating project");
      }
      window.location.reload();
    });
  }

  function create() {
    const containerName = prompt("Enter the container name:");
    const containerPort = prompt("Enter the port you want to use:");
    const containerImage = prompt("Enter the image you want to use:");

    if (!containerName || !containerPort) {
      alert("No valid container name and port provided.");
      return;
    }

    fetch("/createContainer", {
      method: "POST",
      body: JSON.stringify({
        container_name: containerName,
        ports: containerPort,
        image: containerImage,
      }),
    }).then((res) => {
      console.log(res);
      if (res.status === 201 || res.status === 200) {
        alert("Container created");
      } else {
        alert("Error creating container");
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

      {/* <div className={styles.fields}>
        {fields.map((field) => {
          return (
            <div className={styles.field}>
              <label className={styles.name}>{field.name}</label>
              <input type={field.type} className={styles.input} />
            </div>
          );
        })}
      </div> */}

      <button onClick={create} className={styles.createBtn}>
        Create from image
      </button>
    </div>
  );
};

export default CreateContainer;
