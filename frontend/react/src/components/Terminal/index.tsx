import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

function Terminal({
  containerId,
  willClose,
}: {
  containerId: string;
  willClose: boolean;
}) {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [data, setData] = useState("");
  const [prompts, setPrompts] = useState([""]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (input === "clear") {
        setData("");
        setInput("");
        setPrompts([""]);
        return;
      }
      setPrompts((oldPrompts) => [...oldPrompts, input]);
      ws.current?.send(input);
      setInput("");
      return;
    }
  }

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/container_terminal`;

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

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [containerId]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    scrollToBottom();
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
            &#10003; Terminal connected!
          </span>
        )}
        <div className={styles.std} ref={listRef}>
          {data.split("|new_line|").map((line, idx) => {
            if (idx > 0) {
              return (
                <div>
                  <p className={styles.terminalHeader}>{`⮚ ${
                    prompts[idx] || "Container Prompt"
                  }`}</p>
                  <p className={styles.content}>{line}</p>
                </div>
              );
            }
          })}
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
