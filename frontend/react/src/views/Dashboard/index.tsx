import { useEffect, useState } from "react";
import { XCircle, SquareArrowUp, SquareArrowDown } from "lucide-react";
import AnimatedText from "animated-text-letters";
import "animated-text-letters/index.css";
import { apiHandler } from "../../utils/apiHandler";
import styles from "./styles.module.css";
import ContainerDetail from "../../components/ContainerDetail";
import ContainerCard from "../../components/ContainerCard";
import Header from "../../components/Header";
import HardwareInfo from "../../components/HardwareInfo";
import CreateContainer from "../../components/CreateContainer";
import CreateContainerGroup from "../../components/CreateContainerGroup";
import { ContainerInfo } from "../../types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContainerList, setFilteredContainerList] = useState<
    ContainerInfo[]
  >([]);

  function getCurrentView() {
    switch (currentView) {
      case "containers":
        return (
          <>
            <div className={styles.searchBar}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <XCircle
                  size={22}
                  color={searchTerm !== "" ? "#fafafa" : "transparent"}
                  strokeWidth={searchTerm !== "" ? 2.25 : 1}
                  onClick={() => setSearchTerm("")}
                  style={{
                    cursor: "pointer",
                    margin: "0rem 0.5rem",
                    transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    marginRight: "0.75rem",
                  }}
                />
              </div>

              <div className={styles.containers}>
                <div className={styles.runningContainers}>
                  <SquareArrowUp />
                  <AnimatedText
                    text={filteredContainerList
                      .filter((container) => container.Status.includes("Up"))
                      .length.toString()}
                    animation="pop-up"
                    delay={64}
                    easing="ease"
                    transitionOnlyDifferentLetters={true}
                    animationDuration={600}
                  />
                </div>
                <div className={styles.stoppedContainers}>
                  <SquareArrowDown />
                  <AnimatedText
                    text={filteredContainerList
                      .filter((container) =>
                        container.Status.includes("Exited")
                      )
                      .length.toString()}
                    animation="pop-up"
                    delay={64}
                    easing="ease"
                    transitionOnlyDifferentLetters={true}
                    animationDuration={600}
                  />
                </div>
              </div>
            </div>

            <span className={styles.separator}></span>

            <div className={styles.containerList}>
              {filteredContainerList.map((container, index) => {
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
          </>
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
              containerInfo?.NetworkSettings!.Networks
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
    const response = await apiHandler("/api/get_all_containers", "GET", "", {});
    const data = await response.json();
    setContainerList(data || []);

    const filteredList = data.filter((container: ContainerInfo) =>
      container.Names[0].includes(searchTerm)
    );
    setFilteredContainerList(filteredList);
  }

  useEffect(() => {
    getInfo();
    const interval = setInterval(async () => {
      getInfo();
    }, 5000);

    const filteredList = containerList.filter((container) =>
      container.Names[0].includes(searchTerm)
    );
    setFilteredContainerList(filteredList);

    return () => {
      clearInterval(interval);
    };
  }, [searchTerm]);

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
