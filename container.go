package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os/exec"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
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
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	ctx := context.Background()
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: req.Image,
	}, &container.HostConfig{
		PortBindings: map[nat.Port][]nat.PortBinding{
			nat.Port(req.Ports): {{HostPort: req.Ports}},
		},
		Binds: []string{req.Volume},
	}, nil, nil, req.ContainerName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating container: %s", err), http.StatusInternalServerError)
		return
	}

	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		http.Error(w, fmt.Sprintf("Error starting container: %s", err), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Container started successfully: %s\n", resp.ID)
	w.WriteHeader(http.StatusCreated)
}

func StopContainer(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	ctx := context.Background()
	if err := cli.ContainerStop(ctx, req.ContainerId, container.StopOptions{
			Timeout: nil,
			Signal: "SIGKILL",
	}); err != nil {
		http.Error(w, fmt.Sprintf("Error stopping container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Container stopped successfully")
}

func RunContainerById(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	ctx := context.Background()
	if err := cli.ContainerStart(ctx, req.ContainerId, types.ContainerStartOptions{}); err != nil {
		http.Error(w, fmt.Sprintf("Error starting container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Container started successfully")
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
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	ctx := context.Background()
	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{All: true})
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting container list: %s", err), http.StatusInternalServerError)
		return
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

	cli, err := client.NewClientWithOpts(client.FromEnv,client.WithVersion("1.42"))
	if err != nil {
		fmt.Println("Error removing container: ", err)
	}
	defer cli.Close()

	ctx := context.Background()
	err = cli.ContainerRemove(ctx, req.ContainerId, types.ContainerRemoveOptions{})
	if err != nil {
		fmt.Println("Error removing container: ", err)
	}

	fmt.Println("Container removed successfully")
	w.WriteHeader(http.StatusOK)
}
