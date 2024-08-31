package main

import (
	"fmt"
	"net/http"

	AuthModule "Dumont/modules/auth"
	ContainerModule "Dumont/modules/container"
	GroupModule "Dumont/modules/group"
	HardwareModule "Dumont/modules/hardware"
)

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend/react/dist")))
	
	http.HandleFunc("/login", AuthModule.Login)

	http.HandleFunc("/getContainerList", AuthModule.VerifyJWT(ContainerModule.HandleContainerList))
	http.HandleFunc("/deleteContainer", AuthModule.VerifyJWT(ContainerModule.HandleDeleteContainer))
	http.HandleFunc("/getHardwareInfo", AuthModule.VerifyJWT(HardwareModule.HandleHardwareInfo))
	http.HandleFunc("/createContainer", AuthModule.VerifyJWT(ContainerModule.StartContainer))
	http.HandleFunc("/stopContainer", AuthModule.VerifyJWT(ContainerModule.StopContainer))
	http.HandleFunc("/runContainer", AuthModule.VerifyJWT(ContainerModule.RunContainerById))
	http.HandleFunc("/getContainerInfo", AuthModule.VerifyJWT(ContainerModule.HandleGetContainerInfo))
	http.HandleFunc("/cloneRepo", AuthModule.VerifyJWT(ContainerModule.HandleClone))
	http.HandleFunc("/terminal", ContainerModule.TerminalHandler)
	http.HandleFunc("/logs", ContainerModule.LogsHandler)

	http.HandleFunc("/saveAndDeployGroup", AuthModule.VerifyJWT(GroupModule.HandleSaveAndDeployGroup))


	const PORT = ":3323"
	fmt.Println("Server started on port " , PORT)
	err := http.ListenAndServe(PORT, nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}
