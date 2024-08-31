import { useState } from "react";
import { apiHandler } from "../../utils/apiHandler";
import CloseBtn from "../CloseBtn";
import styles from "./styles.module.css";
import { toast } from "react-toastify";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-yaml";
import "./theme.css";

export default function CreateContainerGroup({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const [groupText, setGroupText] = useState(`version: '3.9'

services:
  nginx:
    image: nginx:latest
    ports:
      - "3223:80"
    restart: always`);
  const [groupName, setGroupName] = useState("New Container Group");
  const [isLoading, setIsLoading] = useState(false);

  function handleSaveAndDeploy() {
    const n = new Date().getTime().toString();
    setGroupName(n);
    setIsLoading(true);
    apiHandler("/api/save_and_deploy_group", "POST", "application/json", {
      name: n,
      text: groupText,
    }).then((response) => {
      if (response.ok) {
        toast.success("Group saved and deployed!");
        handleClose();
      } else {
        toast.error("Error saving and deploying group 😢");
      }
      setIsLoading(false);
    });
  }

  return (
    <div className={styles.container}>
      {!isLoading ? (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{groupName}</h1>
            <CloseBtn handleClose={handleClose} />
          </div>
          <Editor
            value={groupText}
            onValueChange={(code) => setGroupText(code)}
            highlight={(code) => highlight(code, languages.yml, "yaml")}
            padding={16}
            className={`${styles.textarea} ${styles.editor}`}
          />
          <div className={styles.buttonsContainer}>
            <button onClick={handleSaveAndDeploy} className={styles.button}>
              Save & Deploy
            </button>
          </div>
        </>
      ) : (
        <div className={styles.loading}>
          <img src="/assets/ldng.webp" alt="Loader" className={styles.loader} />
        </div>
      )}
    </div>
  );
}
