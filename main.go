package main

import (
	"fmt"
	"net/http"
)

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend/react/dist")))

	http.HandleFunc("/cloneRepo", HandleClone)
	http.HandleFunc("/getContainerList", verifyJWT(HandleContainerList))
	http.HandleFunc("/deleteContainer", verifyJWT(HandleDeleteContainer))
	http.HandleFunc("/getHardwareInfo", verifyJWT(HandleHardwareInfo))
	http.HandleFunc("/createContainer", verifyJWT(StartContainer))
	http.HandleFunc("/stopContainer", verifyJWT(StopContainer))
	http.HandleFunc("/runContainer", verifyJWT(RunContainerById))
	http.HandleFunc("/login", Login)

	fmt.Println("Server started on :3322")
	err := http.ListenAndServe(":3322", nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}
