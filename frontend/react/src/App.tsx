import { useState, useEffect } from "react";
import ContainerCard from "./components/ContainerCard";
import ContainerImage from "./assets/containers.png";
import "./App.css";

function App() {
  const [repoLink, setRepoLink] = useState("");
  const [containerList, setContainerList] = useState([
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "2354:2354",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Demoiselle",
      Status: "Up 17 hrs",
      Ports: "4472:4472",
      CreatedAt: "20230102",
      ID: "JH43gd9",
    },
  ]);

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
    <div className="container">
      <h1 className="title">Dumont</h1>
      <input
        type="text"
        value={repoLink}
        onChange={(e) => setRepoLink(e.target.value)}
        placeholder="https://github.com/lnardon/Dumont.git"
        className="url-input"
      />
      <button onClick={sendRepoLink} className="clone-btn">
        Deploy
      </button>

      <div className="containers-title">
        <h3>Your Containers:</h3>
        <img
          src={ContainerImage}
          alt="Containers"
          className="containers-title-image"
        />
      </div>
      <div className="containerList">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {containerList?.map((container: any) => {
          return (
            <ContainerCard
              key={container.ID}
              name={container.Names}
              ports={container.Ports}
              handleDelete={handleDelete}
              createdAt={container.CreatedAt}
              id={container.ID}
              status={container.Status}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
