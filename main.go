package main

import (
	"fmt"
	"net/http"
)

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend/react/dist")))

	http.HandleFunc("/cloneRepo", HandleClone)
	http.HandleFunc("/getContainerList", HandleContainerList)
	http.HandleFunc("/deleteContainer", HandleDeleteContainer)
	http.HandleFunc("/getHardwareInfo", HandleHardwareInfo)
	http.HandleFunc("/createContainer", StartContainer)
	http.HandleFunc("/stopContainer", StopContainer)
	http.HandleFunc("/runContainer", RunContainerById)

	fmt.Println("Server started on :3322")
	err := http.ListenAndServe(":3322", nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}
