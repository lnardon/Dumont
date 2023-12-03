package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

type Request struct {
	RepoURL string `json:"repo_url"`
	Port string `json:"container_port"`
	ContainerId string `json:"container_id"`
	ContainerName string `json:"container_name"`
}

type CreateRequest struct {
	ContainerName   string `json:"container_name"`
	Ports           string `json:"ports"`
	Image           string `json:"image"`
	Volume           string `json:"volume"`
}

func StartContainer(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()
	var req CreateRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	var commandParts []string
	commandParts = append(commandParts, "docker", "run", "-d")
	if req.ContainerName != "" {
		commandParts = append(commandParts, "--name", req.ContainerName)
	}
	if req.Ports != "" {
		commandParts = append(commandParts, "-p", req.Ports)
	}
	if req.Volume != "" {
		commandParts = append(commandParts, "-v", req.Volume)
	}
	if req.Image != "" {
		commandParts = append(commandParts, req.Image)
	} else {
		http.Error(w, "Image name is required", http.StatusBadRequest)
		return
	}

	cmd := exec.Command(commandParts[0], commandParts[1:]...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error running docker command: %v\n", err)
		return
	}

	fmt.Fprintf(w, "%s\n", output)
	w.WriteHeader(http.StatusCreated)
}

func StopContainer(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()
	var req Request
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	if err := cmdFactory("docker stop " + req.ContainerId); err != nil {
		http.Error(w, fmt.Sprintf("Error stoping container: %s", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func RunContainerById(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	var req Request
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	if err := cmdFactory("docker start " + req.ContainerId); err != nil {
		http.Error(w, fmt.Sprintf("Error running container: %s", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func gitClone(repoURL, dest string) error {
	cmd := exec.Command("git", "clone", repoURL, dest)
	return cmd.Run()
}

func dockerBuild(imageName, context string) error {
	cmd := exec.Command("docker", "build", "-t", imageName, context)
	return cmd.Run()
}

func dockerRun(imageName string, port string) error {
    cmd := exec.Command("docker", "run", "-d", "-p", port, imageName)
	return cmd.Run()
}

func HandleClone(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}

	var req Request
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	rId := fmt.Sprintf("%d", rand.Intn(100))
	repoPath := "repositories/" + rId
	if err := gitClone(req.RepoURL, repoPath); err != nil {
		http.Error(w, fmt.Sprintf("Error cloning repository: %s", err), http.StatusInternalServerError)
		return
	}

	imageName := fmt.Sprintf("cloned_repo_image_%s", rId)
	if err := dockerBuild(imageName, repoPath); err != nil {
		http.Error(w, fmt.Sprintf("Error building Docker image: %s", err), http.StatusInternalServerError)
		return
	}

	if err := dockerRun(imageName, req.Port); err != nil {
		http.Error(w, fmt.Sprintf("Error running Docker container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func HandleContainerList(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Only GET requests are allowed", http.StatusMethodNotAllowed)
        return
    }

    var stdoutBuf, stderrBuf bytes.Buffer
    cmd := exec.Command("docker", "ps", "-a", "--format", "{{json .}}")
    cmd.Stdout = &stdoutBuf
    cmd.Stderr = &stderrBuf

    if err := cmd.Run(); err != nil {
        http.Error(w, fmt.Sprintf("Error getting container list: %s, Details: %s", err, stderrBuf.String()), http.StatusInternalServerError)
        return
    }

    containerOutputs := strings.Split(stdoutBuf.String(), "\n")
    var containers []json.RawMessage
    for _, containerOutput := range containerOutputs {
        if containerOutput == "" {
            continue
        }
        containers = append(containers, json.RawMessage(containerOutput))
    }

    jsonContainers, err := json.Marshal(containers)
    if err != nil {
        http.Error(w, fmt.Sprintf("Error marshaling container list: %s", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write(jsonContainers)
}

func HandleDeleteContainer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	var req Request
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	if err := cmdFactory("docker stop " + req.ContainerId); err != nil {
		http.Error(w, fmt.Sprintf("Error stoping container: %s", err), http.StatusInternalServerError)
		return
	}
		if err := cmdFactory("docker remove " + req.ContainerId); err != nil {
		http.Error(w, fmt.Sprintf("Error deleting container: %s", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func cmdFactory(command string)error{
    args := strings.Fields(command)
    if len(args) == 0 {
        fmt.Println("No command provided")
    }
    cmd := exec.Command(args[0], args[1:]...)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Run() 
}