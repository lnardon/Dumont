import { useEffect, useState } from "react";
import styles from "./styles.module.css";

const HardwareInfoComponent: React.FC = () => {
  const [cpuInfo, setCpuInfo] = useState("0%");
  const [ramInfo, setRamInfo] = useState("0");
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [usedStorage, setUsedStorage] = useState(0);
  const [totalStorage, setTotalStorage] = useState(1);

  async function getInfo() {
    const response = await fetch("/getHardwareInfo");
    const data = await response.json();
    const cpuUsageValue = parseFloat(data.cpu_usage.replace("%", ""));
    const ramUsageValue = parseFloat(data.ram_usage.match(/(\d+.\d+)%/)[1]);
    setCpuInfo(data.cpu_usage);
    setRamInfo(data.ram_usage);
    setCpuUsage(cpuUsageValue);
    setRamUsage(ramUsageValue);
    setUsedStorage(data.usedStorage);
    setTotalStorage(data.totalStorage);
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      "Bytes",
      "KiB",
      "MiB",
      "GiB",
      "TiB",
      "PiB",
      "EiB",
      "ZiB",
      "YiB",
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  useEffect(() => {
    getInfo();
    const interval = setInterval(async () => {
      getInfo();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.container}>
      <span className={styles.blinbkingDot}></span>
      <div className={styles.hardwareInfo}>
        <div className={styles.hardwareInfoItem}>
          <div className={styles.hardwareInfoTitle}>
            <h3 className={styles.title}>CPU</h3>
            <p className={styles.infoDetail}>{cpuInfo}</p>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${cpuUsage.toFixed(0)}%` }}
            ></div>
          </div>
          <p className={styles.infoDetail}>Soon...</p>
        </div>
        <div className={styles.hardwareInfoItem}>
          <div className={styles.hardwareInfoTitle}>
            <h3 className={styles.title}>RAM</h3>
            <p className={styles.infoDetail}>{ramUsage.toFixed(0)}%</p>
          </div>
          {/* TODO: Change this to a cleaner solution */}
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
              {((100 * usedStorage) / totalStorage).toFixed(0)}%
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
