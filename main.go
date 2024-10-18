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
    http.Handle("/", http.FileServer(http.Dir("./dist")))
	
	// Auth
	http.HandleFunc("/api/login", AuthModule.Login)

	// Containers
	http.HandleFunc("/api/get_all_containers", AuthModule.VerifyJWT(ContainerModule.HandleContainerList))
	http.HandleFunc("/api/create_container", AuthModule.VerifyJWT(ContainerModule.StartContainer))
	http.HandleFunc("/api/get_container_info", AuthModule.VerifyJWT(ContainerModule.HandleGetContainerInfo))
	http.HandleFunc("/api/container_logs", ContainerModule.LogsHandler)
	http.HandleFunc("/api/container_terminal", ContainerModule.TerminalHandler)
	http.HandleFunc("/api/stop_container", AuthModule.VerifyJWT(ContainerModule.StopContainer))
	http.HandleFunc("/api/run_container", AuthModule.VerifyJWT(ContainerModule.RunContainerById))
	http.HandleFunc("/api/delete_container", AuthModule.VerifyJWT(ContainerModule.HandleDeleteContainer))

	// Misc
	http.HandleFunc("/api/save_and_deploy_group", AuthModule.VerifyJWT(GroupModule.HandleSaveAndDeployGroup))
	http.HandleFunc("/api/get_hardware_info", AuthModule.VerifyJWT(HardwareModule.HandleHardwareInfo))
	http.HandleFunc("/api/clone_repo", AuthModule.VerifyJWT(ContainerModule.HandleClone))


	const PORT = ":3322"
	fmt.Println("Server started on port " , PORT)
	err := http.ListenAndServe(PORT, nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}
