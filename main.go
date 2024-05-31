package main

import (
	"fmt"
	"net/http"
)

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend/react/dist")))
	
	http.HandleFunc("/login", Login)

	http.HandleFunc("/getContainerList", verifyJWT(HandleContainerList))
	http.HandleFunc("/deleteContainer", verifyJWT(HandleDeleteContainer))
	http.HandleFunc("/getHardwareInfo", verifyJWT(HandleHardwareInfo))
	http.HandleFunc("/createContainer", verifyJWT(StartContainer))
	http.HandleFunc("/stopContainer", verifyJWT(StopContainer))
	http.HandleFunc("/runContainer", verifyJWT(RunContainerById))
	http.HandleFunc("/getContainerInfo", verifyJWT(HandleGetContainerInfo))
	http.HandleFunc("/cloneRepo", verifyJWT(HandleClone))
	http.HandleFunc("/terminal", TerminalHandler)
	http.HandleFunc("/logs", LogsHandler)

	http.HandleFunc("/saveAndDeployGroup", verifyJWT(handleSaveAndDeployGroup))


	const PORT = ":3322"
	fmt.Println("Server started on port " , PORT)
	err := http.ListenAndServe(PORT, nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}
