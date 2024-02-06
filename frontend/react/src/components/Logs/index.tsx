import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

function Logs({
  containerId,
  willClose,
}: {
  containerId: string;
  willClose: boolean;
}) {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [data, setData] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/logs`;

      ws.current = new WebSocket(wsUrl);
      ws.current.binaryType = "arraybuffer";
      ws.current.onopen = () => {
        setIsSocketConnected(true);
        ws.current?.send("container_id:" + containerId);
      };

      ws.current.onmessage = (event) => {
        const message = new Uint8Array(event.data);
        const str = new TextDecoder("utf-8").decode(message);
        setData((oldString) => oldString + "|new_line|" + str);
      };
    }, 750);
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [containerId]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [data]);

  useEffect(() => {
    if (willClose) {
      containerRef.current?.classList.add(styles.willClose);
    }
  }, [willClose]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.terminal}>
        {isSocketConnected && (
          <span
            className={styles.success}
            style={{
              marginBottom: "1rem",
              borderLeft: "0.25rem solid limegreen",
              paddingLeft: "0.5rem",
              borderRadius: "0.25rem",
              opacity: 0,
            }}
          >
            &#10003; Container logs connected!
          </span>
        )}
        <div className={styles.std} ref={listRef}>
          {data.split("|new_line|").map((line) => (
            <p className={styles.content}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Logs;
