/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

function Terminal({ containerId }: { containerId: string }) {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [data, setData] = useState("");
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  function handleInput(e: any) {
    if (e.key === "Enter") {
      if (input === "clear") {
        setData("");
        setInput("");
        return;
      }
      ws.current?.send(input);
      setInput("");
      return;
    }
    if (e.key === "Backspace") {
      setInput((old) => old.slice(0, -1));
      return;
    }
  }

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3321/ws");
    ws.current.binaryType = "arraybuffer";
    ws.current.onopen = () => {
      console.log("Connected to WebSocket");
      setIsSocketConnected(true);
      ws.current?.send("container_id:" + containerId);
    };

    ws.current.onmessage = (event) => {
      const message = new Uint8Array(event.data);
      const str = new TextDecoder("utf-8").decode(message);
      setData((oldString) => oldString + "|new_line|" + str);
    };

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

  return (
    <div className={styles.container}>
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
            &#10003; Successfully connected!
          </span>
        )}
        <div className={styles.std} ref={listRef}>
          {data.split("|new_line|").map((line) => (
            <p className={styles.content}>{line}</p>
          ))}
        </div>
        {isSocketConnected && (
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={styles.input}
              onKeyDown={handleInput}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter command here"
              value={input}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminal;
