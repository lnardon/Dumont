import { useState, useEffect } from "react";
import "./App.css";
import ContainerCard from "./components/ContainerCard";
import Header from "./components/Header";
import HardwareInfo from "./components/HardwareInfo";
import Modal from "./components/Modal";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [containerList, setContainerList] = useState([
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
  ]);

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

  // function handleDelete(containerId: string) {
  //   fetch("/deleteContainer", {
  //     method: "POST",
  //     body: JSON.stringify({ container_id: containerId }),
  //   }).then((res) => {
  //     if (res.status === 200) {
  //       alert("Container deleted");
  //     } else {
  //       alert("Error deleting container");
  //     }
  //     window.location.reload();
  //   });
  // }

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
    <>
      <Header handleCreate={sendRepoLink} />
      <div className="content">
        <HardwareInfo />
        <div className="container">
          <div className="containerList">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {containerList?.map((container: any) => {
              return (
                <ContainerCard
                  key={container.ID}
                  name={container.Names}
                  ports={container.Ports}
                  handleOpen={(port: string) => {
                    window.open(
                      `${window.location.protocol}//${window.location.hostname}:${port}`,
                      "_blank"
                    );
                  }}
                  createdAt={container.CreatedAt}
                  id={container.ID}
                />
              );
            })}
          </div>
        </div>
      </div>
      {isOpen && (
        <Modal setIsOpen={setIsOpen} renderComponent={<div>{"hello"}</div>} />
      )}
    </>
  );
}

export default App;
