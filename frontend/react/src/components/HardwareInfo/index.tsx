import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { apiHandler } from "../../utils/apiHandler";
import formatBytes from "../../utils/formatBytes";

const HardwareInfoComponent: React.FC = () => {
  const [cpuCores, setCpuCores] = useState<string[]>([]);
  const [cpuClock, setCpuClock] = useState(0);
  const [ramInfo, setRamInfo] = useState("0");
  const [ramUsage, setRamUsage] = useState(0);
  const [usedStorage, setUsedStorage] = useState(0);
  const [totalStorage, setTotalStorage] = useState(1);

  async function getInfo() {
    const response = await apiHandler("/api/get_hardware_info", "GET", "", {});
    const data = await response.json();
    setCpuCores(data.cpu_usage);
    setRamInfo(data.ram_usage);
    setRamUsage(parseFloat(data.ram_usage.match(/(\d+.\d+)%/)[1]));
    setUsedStorage(data.usedStorage);
    setTotalStorage(data.totalStorage);
    setCpuClock(data.cpuClockSpeed);
  }

  function formatFrequency(mhz: number): string {
    if (mhz >= 1000) {
      return `${(mhz / 1000).toFixed(1)} GHz`;
    } else {
      return `${mhz.toFixed(0)} MHz`;
    }
  }

  useEffect(() => {
    getInfo();
    const interval = setInterval(getInfo, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <span className={styles.blinbkingDot}></span>
      <div className={styles.hardwareInfo}>
        <div key={"cpu_cores"} className={styles.hardwareInfoItem}>
          <div className={styles.hardwareInfoTitle}>
            <h3 className={styles.title}>
              CPU
              <span
                style={{
                  width: "50%",
                  fontSize: "0.8rem",
                  fontWeight: 400,
                  marginLeft: "0.25rem",
                }}
              >
                (
                {cpuCores.length > 1
                  ? ` ${cpuCores.length - 1} cores `
                  : " 1 core "}
                )
              </span>
            </h3>
            <p className={styles.infoDetail}>
              {cpuCores[0]?.split(":")[1] || ""}
            </p>
          </div>
          <div className={styles.coresContainer}>
            {cpuCores.length > 1 &&
              cpuCores.slice(1).map((core, index) => (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    key={index}
                    style={{
                      width: core.split(":")[1],
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
              ))}
          </div>
          <p className={styles.infoDetail}>{formatFrequency(cpuClock)}</p>
        </div>
        <div className={styles.hardwareInfoItem}>
          <div className={styles.hardwareInfoTitle}>
            <h3 className={styles.title}>RAM</h3>
            <p className={styles.infoDetail}>{ramUsage.toFixed(2)}%</p>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${ramUsage}%` }}
            ></div>
          </div>
          <p className={styles.infoDetail}>
            {`${formatBytes(
              parseInt(ramInfo.split("/")[0]) * 1024 * 1024
            )} / ${formatBytes(parseInt(ramInfo.split("/")[1]) * 1024 * 1024)}`}
          </p>
        </div>
        <div className={styles.hardwareInfoItem}>
          <div className={styles.hardwareInfoTitle}>
            <h3 className={styles.title}>Storage</h3>
            <p className={styles.infoDetail}>
              {((100 * usedStorage) / totalStorage).toFixed(2)}%
            </p>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${(100 * usedStorage) / totalStorage}%` }}
            ></div>
          </div>
          <p className={styles.infoDetail}>{`${formatBytes(
            usedStorage
          )} / ${formatBytes(totalStorage)}`}</p>
        </div>
      </div>
    </div>
  );
};

export default HardwareInfoComponent;
