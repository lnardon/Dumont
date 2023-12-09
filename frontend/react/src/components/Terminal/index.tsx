/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

function Terminal({ containerId }: { containerId: string }) {
  const [data, setData] = useState("");
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);

  function handleInput(e: any) {
    if (e.key === "Enter") {
      ws.current?.send(input);
      setInput("");
      return;
    }
    if (e.key === "Backspace") {
      setInput((old) => old.slice(0, -1));
      return;
    }

    console.log(e);
    setInput((old) => old + e.key);
  }

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3321/ws");
    ws.current.binaryType = "arraybuffer";
    ws.current.onopen = () => {
      console.log("Connected to WebSocket");
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

  return (
    <div className={styles.container}>
      <div className={styles.terminal}>
        <div className={styles.std}>
          {data.split("|new_line|").map((line) => (
            <p className={styles.content}>{line}</p>
          ))}
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.input}
            onKeyDown={handleInput}
            placeholder="Enter command here"
            value={input}
          />
        </div>
      </div>
    </div>
  );
}

export default Terminal;
