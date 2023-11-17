import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [repoLink, setRepoLink] = useState("");
  const [containerList, setContainerList] = useState([]);

  function sendRepoLink() {
    const containerPort = prompt("Enter the port you want to use:");
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

  function handleDelete(containerId: string) {
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

  useEffect(() => {
    fetch("/getContainerList", {
      method: "GET",
    }).then((parsed) => {
      parsed.json().then((data) => {
        setContainerList(data);
      });
    });
  }, []);

  return (
    <div>
      <h1>Dumont</h1>
      <input
        type="text"
        value={repoLink}
        onChange={(e) => setRepoLink(e.target.value)}
        placeholder="https://github.com/lnardon/Dumont.git"
      />
      <button onClick={sendRepoLink}>Deploy</button>

      <div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {containerList?.map((container: any) => {
          return (
            <div>
              <h3>{container.Names}</h3>
              <p>{container.Status}</p>
              <p>{container.Ports}</p>
              <p>{container.CreatedAt}</p>
              <button onClick={() => handleDelete(container.ID)}>Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
