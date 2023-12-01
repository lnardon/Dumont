import { useState, useEffect } from "react";
import "./App.css";
import ContainerCard from "./components/ContainerCard";
import Header from "./components/Header";
import HardwareInfo from "./components/HardwareInfo";
import Modal from "./components/Modal";
import CreateContainer from "./components/CreateContainer";
import ContainerDetail from "./components/ContainerDetail";

function App() {
  const [currentView, setCurrentView] = useState("containers");
  const [containerInfo, setContainerInfo] = useState({
    Names: "Dumont",
    Status: "Up 12 hrs",
    Ports: "3322:3322",
    CreatedAt: "20231112",
    ID: "aD34SfSDV",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [containerList, setContainerList] = useState([
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
    {
      Names: "Dumont",
      Status: "Up 12 hrs",
      Ports: "3322:3322",
      CreatedAt: "20231112",
      ID: "aD34SfSDV",
    },
  ]);

  function handleOpen() {
    setIsOpen(true);
  }

  function getCurrentView() {
    switch (currentView) {
      case "containers":
        return (
          <div className="containerList">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {containerList.map((container: any, index) => {
              return (
                <ContainerCard
                  key={container.ID}
                  name={container.Names}
                  handleOpen={() => {
                    setContainerInfo(container);
                    setCurrentView("containerDetail");
                  }}
                  index={index}
                  status={container.Status}
                />
              );
            })}
          </div>
        );
      case "containerDetail":
        return (
          <ContainerDetail
            handleClose={() => setCurrentView("containers")}
            containerName={containerInfo.Names}
            containerImage={""}
            containerStarted={""}
            containerStatus={containerInfo.Status}
            containerPorts={containerInfo.Ports}
            containerId={containerInfo.ID}
          />
        );
    }
  }

  useEffect(() => {
    fetch("/getContainerList", {
      method: "GET",
    }).then((parsed) => {
      parsed.json().then((data) => {
        setContainerList(data || []);
      });
    });
  }, []);

  return (
    <>
      <Header handleCreate={handleOpen} />
      <div className="content">
        <div className="sidebar">
          <HardwareInfo />
        </div>
        <div className="container">{getCurrentView()}</div>
      </div>
      {isOpen && (
        <Modal setIsOpen={setIsOpen} renderComponent={<CreateContainer />} />
      )}
    </>
  );
}

export default App;
