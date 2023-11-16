import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [repoLink, setRepoLink] = useState("");
  const [containerList, setContainerList] = useState([]);

  function sendRepoLink() {
    const containerPort = prompt("Enter the port you want to use:");
    console.log(containerPort);
    fetch("/cloneRepo", {
      method: "POST",
      body: JSON.stringify({ repo_url: repoLink }),
    }).then((parsed) => console.log(parsed));
  }

  useEffect(() => {
    fetch("/getContainerList", {
      method: "GET",
    }).then((parsed) => {
      parsed.json().then((data) => {
        setContainerList(data);
        console.log(data);
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
        {containerList.map((container: any) => {
          return (
            <div>
              <h3>{container.Names}</h3>
              <p>{container.Status}</p>
              <p>{container.Ports}</p>
              <p>{container.CreatedAt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
