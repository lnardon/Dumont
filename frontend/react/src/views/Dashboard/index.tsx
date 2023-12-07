/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import ContainerDetail from "../../components/ContainerDetail";
import ContainerCard from "../../components/ContainerCard";
import Header from "../../components/Header";
import HardwareInfo from "../../components/HardwareInfo";
import CreateContainer from "../../components/CreateContainer";
import styles from "./styles.module.css";
import { apiHandler } from "../../utils/apiHandler";

type ContainerCardInfo = {
  Names: string;
  Status: string;
};

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState("containers");
  const [containerInfo, setContainerInfo] = useState<any>({
    Names: "",
    Status: "",
    Ports: "",
    Id: "",
    Image: "",
    Networks: "",
    Size: "",
  });
  const [containerList, setContainerList] = useState<ContainerCardInfo[]>([]);

  function handleOpen() {
    setCurrentView("createContainer");
  }

  function getCurrentView() {
    switch (currentView) {
      case "containers":
        return (
          <div className={styles.containerList}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {containerList.map((container: any, index) => {
              return (
                <ContainerCard
                  key={container.ID}
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
            containerPorts={
              containerInfo?.Ports[0]?.PublicPort &&
              containerInfo?.Ports[0]?.PrivatePort
                ? containerInfo?.Ports[0]?.PublicPort +
                  ":" +
                  containerInfo?.Ports[0]?.PrivatePort
                : ""
            }
            containerNetwork={Object.keys(
              containerInfo?.NetworkSettings?.Networks
            )[0].toString()}
            containerId={containerInfo.Id}
            createdAt={containerInfo.Created}
          />
        );

      case "createContainer":
        return (
          <CreateContainer handleClose={() => setCurrentView("containers")} />
        );
    }
  }

  async function getInfo() {
    const response = await apiHandler("/getContainerList", "GET", "", {});
    const data = await response.json();
    setContainerList(data);
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
  return (
    <div className={styles.dashboard}>
      <Header handleCreate={handleOpen} />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <HardwareInfo />
        </div>
        <div className={styles.container}>{getCurrentView()}</div>
      </div>
    </div>
  );
};

export default Dashboard;
