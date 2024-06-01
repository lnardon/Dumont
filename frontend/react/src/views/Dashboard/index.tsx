import { useEffect, useState } from "react";
import { apiHandler } from "../../utils/apiHandler";
import styles from "./styles.module.css";
import ContainerDetail from "../../components/ContainerDetail";
import ContainerCard from "../../components/ContainerCard";
import Header from "../../components/Header";
import HardwareInfo from "../../components/HardwareInfo";
import CreateContainer from "../../components/CreateContainer";
import CreateContainerGroup from "../../components/CreateContainerGroup";

type ContainerInfo = {
  Names: string;
  Status: string;
  Ports: any[];
  Id: string;
  Image: string;
  Networks: string;
  Size: string;
  NetworkSettings?: any;
  Created?: number;
};

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState("containers");
  const [containerInfo, setContainerInfo] = useState<ContainerInfo>({
    Names: "",
    Status: "",
    Ports: [],
    Id: "",
    Image: "",
    Networks: "",
    Size: "",
  });
  const [containerList, setContainerList] = useState<ContainerInfo[]>([]);

  function getCurrentView() {
    switch (currentView) {
      case "containers":
        return (
          <div className={styles.containerList}>
            {containerList.map((container, index) => {
              return (
                <ContainerCard
                  key={container.Id}
                  name={container.Names[0].replace("/", "")}
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
            containerName={containerInfo.Names[0].replace("/", "")}
            containerImage={containerInfo.Image}
            containerStatus={containerInfo.Status}
            containerPorts={containerInfo?.Ports}
            containerNetwork={Object.keys(
              containerInfo.NetworkSettings.Networks
            ).join(", ")}
            containerId={containerInfo.Id}
            createdAt={containerInfo.Created || 0}
          />
        );

      case "createContainer":
        return (
          <CreateContainer handleClose={() => setCurrentView("containers")} />
        );

      case "createContainerGroup":
        return (
          <CreateContainerGroup
            handleClose={() => setCurrentView("containers")}
          />
        );
    }
  }

  async function getInfo() {
    const response = await apiHandler("/getContainerList", "GET", "", {});
    const data = await response.json();
    setContainerList(data || []);
  }

  useEffect(() => {
    getInfo();
    const interval = setInterval(async () => {
      getInfo();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (currentView === "containerDetail") {
      const updatedContainer = containerList.find(
        (c) => c.Id === containerInfo.Id
      );
      if (
        updatedContainer &&
        updatedContainer.Status !== containerInfo.Status
      ) {
        setContainerInfo(updatedContainer);
      }
    }
  }, [containerList, currentView]);

  return (
    <div className={styles.dashboard}>
      <Header handleCreate={setCurrentView} />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <HardwareInfo />
          <button
            onClick={() => {
              sessionStorage.removeItem("token");
              window.location.href = "/";
            }}
            className={styles.logout}
          >
            Logout
          </button>
        </div>
        <div className={styles.container}>{getCurrentView()}</div>
      </div>
    </div>
  );
};

export default Dashboard;
