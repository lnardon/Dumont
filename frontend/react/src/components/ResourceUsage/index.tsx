/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { apiHandler } from "../../utils/apiHandler";
import styles from "./styles.module.css";
import formatBytes from "../../utils/formatBytes";

const CircleGraph = ({
  percentage,
  label,
}: {
  percentage: any;
  label: string;
}) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokePct = ((100 - parseFloat(percentage)) * circumference) / 100;
  return (
    <svg width={64} height={64}>
      <circle
        r={radius}
        cx={32}
        cy={32}
        fill="transparent"
        stroke="rgba(127, 127, 156, 0.32)"
        strokeWidth="4"
      />
      <circle
        r={radius}
        cx={32}
        cy={32}
        fill="transparent"
        stroke="antiquewhite"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={strokePct}
        transform={`rotate(270 32 32)`}
        style={{ transition: "all 0.7s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        style={{ color: "antiquewhite" }}
        fill="white"
        fontSize="12"
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
};

const ResourceUsage: React.FC<{ containerId: string }> = ({ containerId }) => {
  const [data, setData] = useState<any>({});

  function getInfo() {
    const response = apiHandler("/getContainerInfo", "POST", "", {
      container_id: containerId,
    });

    response.then((res) => {
      res.json().then((data) => {
        console.log(data);
        setData(data);
      });
    });
  }

  function calculateCPUUsage() {
    const containerStats = data || {};
    const cpuDelta =
      containerStats?.cpu_stats?.cpu_usage?.total_usage -
      containerStats?.precpu_stats?.cpu_usage?.total_usage;
    const systemDelta =
      containerStats?.cpu_stats?.system_cpu_usage -
      containerStats?.precpu_stats?.system_cpu_usage;
    const numberOfCPU = containerStats?.cpu_stats?.online_cpus;

    if (systemDelta && numberOfCPU && systemDelta !== 0) {
      const cpuPercentage = (cpuDelta / systemDelta) * numberOfCPU * 100.0;
      return cpuPercentage.toFixed(2);
    }

    return "0";
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
        <CircleGraph
          percentage={
            ((data?.networks?.eth0?.rx_bytes || 0) /
              (data?.networks?.eth0?.rx_bytes +
                data?.networks?.eth0?.tx_bytes || 1)) *
            100
          }
          label="I / O"
        />
        <p style={{ textAlign: "center" }}>
          {`${formatBytes(data?.networks?.eth0?.rx_bytes) || 0} \u2193 / ${
            formatBytes(data?.networks?.eth0?.tx_bytes) || 0
          } \u2191`}
        </p>
      </div>
    </div>
  );
};

export default ResourceUsage;
