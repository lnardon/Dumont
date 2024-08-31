/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";
import { apiHandler } from "../../utils/apiHandler";
import styles from "./styles.module.css";
import formatBytes from "../../utils/formatBytes";
import CircleGraph from "./CircleGraph";

const ResourceUsage: React.FC<{ containerId: string }> = ({ containerId }) => {
  const [data, setData] = useState<any>({});

  function getInfo() {
    const response = apiHandler("/api/get_container_info", "POST", "", {
      container_id: containerId,
    });

    response.then((res) => {
      res.json().then((data) => {
        setData(data);
      });
    });
  }

  function calculateCPUUsage() {
    const containerStats = data || {};
    const cpuStats = containerStats.cpu_stats || {};
    const preCpuStats = containerStats.precpu_stats || {};
    if (!cpuStats.cpu_usage || !preCpuStats.cpu_usage) {
      return 0;
    }

    const cpuDelta =
      cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;
    const systemDelta =
      cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;
    const numberOfCPU = cpuStats.online_cpus;
    if (cpuDelta <= 0 || systemDelta <= 0 || numberOfCPU <= 0) {
      return 0;
    }

    const cpuPercentage = (cpuDelta / systemDelta) * numberOfCPU * 100.0;
    return parseFloat(cpuPercentage.toFixed(2));
  }

  useEffect(() => {
    getInfo();
    const interval = setInterval(getInfo, 5000);
    return () => clearInterval(interval);
  }, [containerId]);

  const cpuPercentage = calculateCPUUsage();
  const ramUsage = data?.memory_stats?.usage || 0;
  const ramLimit = data?.memory_stats?.limit || 0;
  const ramPercentage = (ramUsage / ramLimit) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <CircleGraph percentage={cpuPercentage} label="CPU" />
        {`${cpuPercentage}%`}
      </div>
      <div className={styles.infoContainer}>
        <CircleGraph percentage={ramPercentage || 0} label="RAM" />
        {`${(ramPercentage || 0).toFixed(2)}%`}
      </div>
      <div className={styles.infoContainer}>
        <svg width={64} height={64}>
          <circle
            r={28}
            cx={32}
            cy={32}
            fill="transparent"
            stroke="rgba(127, 127, 156, 0.32)"
            strokeWidth="4"
          />
          <circle
            r={28}
            cx={32}
            cy={32}
            fill="transparent"
            stroke="#2EF657"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={
              -(
                (100 -
                  ((data?.networks?.eth0?.rx_bytes || 0) /
                    (data?.networks?.eth0?.rx_bytes +
                      data?.networks?.eth0?.tx_bytes || 1)) *
                    100) *
                (2 * Math.PI * 28)
              ) / 100
            }
            transform={`rotate(270 32 32)`}
            style={{ transition: "all 0.7s ease" }}
          />
          <circle
            r={28}
            cx={32}
            cy={32}
            fill="transparent"
            stroke="#646cff"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={Math.abs(
              ((100 -
                ((data?.networks?.eth0?.tx_bytes || 0) /
                  (data?.networks?.eth0?.rx_bytes +
                    data?.networks?.eth0?.tx_bytes || 1)) *
                  100) *
                (2 * Math.PI * 28)) /
                100
            )}
            transform={`rotate(-90 32 32)`}
            style={{ transition: "all 0.7s ease" }}
          />
          <text
            x="50%"
            y="50%"
            dy=".3em"
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight={700}
          >
            I / O
          </text>
        </svg>
        <p className={styles.networkText}>
          {formatBytes(data?.networks?.eth0?.rx_bytes) || 0}
          <ArrowBigDownDash
            color="#2EF657"
            fill="#2EF657aa"
            size={20}
            strokeWidth={2}
          />
          |
          <ArrowBigUpDash
            color="#646cff"
            fill="#646cffaa"
            size={20}
            strokeWidth={2}
          />
          {formatBytes(data?.networks?.eth0?.tx_bytes) || 0}
        </p>
      </div>
    </div>
  );
};

export default ResourceUsage;
