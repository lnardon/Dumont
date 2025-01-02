package container

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/docker/go-connections/nat"
	"github.com/gorilla/websocket"
)

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

	networkName := req.Network
	if networkName == "" {
		networkName = req.ContainerName + "_network"
		_, err := cli.NetworkCreate(ctx, networkName, types.NetworkCreate{
			CheckDuplicate: true,
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("Error creating Docker network: %s", err), http.StatusInternalServerError)
			return
		}
	}

	portBindings := nat.PortMap{}
	if req.Ports != "" {
		hostPort := strings.Split(req.Ports, ":")[0]
		containerPort := strings.Split(req.Ports, ":")[1] + "/tcp"
		portBindings[nat.Port(containerPort)] = []nat.PortBinding{{HostPort: hostPort}}
	}

	restartPolicy := container.RestartPolicy{}
	if req.RestartPolicy != "" {
		restartPolicy.Name = req.RestartPolicy
	}

	validEnv := make([]string, 0)
	for _, env := range req.Variables {
		if strings.Contains(env, "=") {
			validEnv = append(validEnv, env)
		}
	}

	validVolumes := make([]string, 0)
	for _, volume := range req.Volumes {
		if volume != "" {
			validVolumes = append(validVolumes, volume)
		}
	}

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: req.Image,
		Env:   validEnv,
	}, &container.HostConfig{
		PortBindings:  portBindings,
		Binds:         validVolumes,
		RestartPolicy: restartPolicy,
		NetworkMode:   container.NetworkMode(networkName),
	}, nil, nil, req.ContainerName)

	if err != nil {
		if strings.Contains(err.Error(), "No such image") {
			out, pullErr := cli.ImagePull(ctx, req.Image, types.ImagePullOptions{})
			if pullErr != nil {
				http.Error(w, fmt.Sprintf("Error pulling container image: %s", pullErr), http.StatusInternalServerError)
				return
			}
			io.Copy(os.Stdout, out)
			out.Close()

			resp, err = cli.ContainerCreate(ctx, &container.Config{
				Image: req.Image,
				Env:   validEnv,
			}, &container.HostConfig{
				PortBindings:  portBindings,
				Binds:         validVolumes,
				RestartPolicy: restartPolicy,
			}, nil, nil, req.ContainerName)
			if err != nil {
				http.Error(w, fmt.Sprintf("Error creating container after pulling image: %s", err), http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, fmt.Sprintf("Error creating container: %s", err), http.StatusInternalServerError)
			return
		}
	}

	if err := cli.NetworkConnect(ctx, networkName, resp.ID, nil); err != nil {
		http.Error(w, fmt.Sprintf("Error connecting container to network: %s", err), http.StatusInternalServerError)
		return
	}

	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		http.Error(w, fmt.Sprintf("Error starting container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "Container started successfully: %s\n", resp.ID)
}

func StopContainer(w http.ResponseWriter, r *http.Request) {
	var req CloneRequest
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
		Signal:  "SIGKILL",
	}); err != nil {
		http.Error(w, fmt.Sprintf("Error stopping container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Container stopped successfully")
}

func RunContainerById(w http.ResponseWriter, r *http.Request) {
	var req CloneRequest
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

	var req CloneRequest
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

	var upContainers []types.Container
	var downContainers []types.Container
	for _, container := range containers {
		if container.State == "running" {
			upContainers = append(upContainers, container)
		} else {
			downContainers = append(downContainers, container)
		}
	}
	upContainers = append(upContainers, downContainers...)
	jsonContainers, err = json.Marshal(upContainers)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error marshaling container list: %s", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonContainers)
}

func HandleGetContainerInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CloneRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request body: %s", err), http.StatusBadRequest)
		return
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	ctx := context.Background()
	stats, err := cli.ContainerStats(ctx, req.ContainerId, false)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting stats for container %s: %s", req.ContainerId, err), http.StatusInternalServerError)
		return
	}
	defer stats.Body.Close()

	var statsJSON types.StatsJSON
	err = json.NewDecoder(stats.Body).Decode(&statsJSON)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error decoding stats for container %s: %s", req.ContainerId, err), http.StatusInternalServerError)
		return
	}

	jsonStats, err := json.Marshal(statsJSON)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error marshaling stats: %s", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonStats)
}

func HandleDeleteContainer(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}

	var req CloneRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
	if err != nil {
		fmt.Println("Error creating sdk client: ", err)
	}
	defer cli.Close()

	ctx := context.Background()
	err = cli.ContainerStop(ctx, req.ContainerId, container.StopOptions{
		Timeout: nil,
		Signal:  "SIGKILL",
	})
	err = cli.ContainerRemove(ctx, req.ContainerId, types.ContainerRemoveOptions{})
	if err != nil {
		fmt.Println("Error removing container: ", err)
	}

	fmt.Println("Container removed successfully")
	w.WriteHeader(http.StatusOK)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func TerminalHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	_, firstMsg, err := conn.ReadMessage()
	if err != nil {
		log.Printf("read container ID from WebSocket error: %v", err)
		return
	}

	messageParts := strings.SplitN(string(firstMsg), ":", 2)
	if len(messageParts) != 2 || messageParts[0] != "container_id" {
		log.Printf("invalid container ID format")
		return
	}
	container_id := messageParts[1]

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Docker client error: %v", err)
		return
	}

	attachOptions := types.ContainerAttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: true,
		Stderr: true,
	}
	hijackedResponse, err := cli.ContainerAttach(context.Background(), container_id, attachOptions)
	if err != nil {
		log.Printf("Container attach error: %v", err)
		return
	}
	defer hijackedResponse.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		defer cancel()
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("read from WebSocket error: %v", err)
				return
			}

			output, err := executeCommandInDocker(container_id, string(message))
			if err != nil {
				log.Printf("execute command error: %v", err)
				continue
			}
			err = conn.WriteMessage(websocket.BinaryMessage, []byte(output))
			if err != nil {
				log.Printf("write to WebSocket error: %v", err)
				return
			}
		}
	}()

	go func() {
		defer cancel()
		buffer := make([]byte, 4096)
		for {
			n, err := hijackedResponse.Reader.Read(buffer)
			if err != nil {
				log.Printf("read from Docker error: %v", err)
				return
			}
			err = conn.WriteMessage(websocket.BinaryMessage, buffer[:n])
			if err != nil {
				log.Printf("write to WebSocket error: %v", err)
				return
			}
		}
	}()

	<-ctx.Done()
}

func executeCommandInDocker(containerID, command string) (string, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", err
	}

	cmdParts := strings.Fields(command)
	if len(cmdParts) == 0 {
		return "", fmt.Errorf("invalid command")
	}

	execConfig := types.ExecConfig{
		Cmd:          cmdParts,
		AttachStdout: true,
		AttachStderr: true,
		AttachStdin:  false,
		Tty:          false,
	}

	execID, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return "", err
	}

	execAttachConfig := types.ExecStartCheck{Tty: false}
	execAttachResponse, err := cli.ContainerExecAttach(ctx, execID.ID, execAttachConfig)
	if err != nil {
		return "", err
	}
	defer execAttachResponse.Close()

	var outputBuffer bytes.Buffer
	_, err = stdcopy.StdCopy(&outputBuffer, &outputBuffer, execAttachResponse.Reader)
	if err != nil {
		return "", err
	}

	return outputBuffer.String(), nil
}

func LogsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	_, firstMsg, err := conn.ReadMessage()
	if err != nil {
		log.Printf("read container ID from WebSocket error: %v", err)
		return
	}

	messageParts := strings.SplitN(string(firstMsg), ":", 2)
	if len(messageParts) != 2 || messageParts[0] != "container_id" {
		log.Printf("invalid container ID format")
		return
	}
	containerID := messageParts[1]

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Docker client error: %v", err)
		return
	}

	logsOptions := types.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "all",
	}

	logStream, err := cli.ContainerLogs(context.Background(), containerID, logsOptions)
	if err != nil {
		log.Printf("Container logs error: %v", err)
		return
	}
	defer logStream.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		defer cancel()
		reader := bufio.NewReader(logStream)
		for {
			header := make([]byte, 8)
			_, err := reader.Read(header)
			if err != nil {
				log.Printf("read header from Docker logs error: %v", err)
				return
			}

			// This piece of code is to remove the docker logs header info that comes on each log message from the API.
			logLength := int(header[7]) | int(header[6])<<8 | int(header[5])<<16 | int(header[4])<<24
			logMessage := make([]byte, logLength)

			_, err = reader.Read(logMessage)
			if err != nil {
				log.Printf("read log message from Docker logs error: %v", err)
				return
			}

			err = conn.WriteMessage(websocket.TextMessage, logMessage)
			if err != nil {
				log.Printf("write to WebSocket error: %v", err)
				return
			}
		}
	}()

	<-ctx.Done()
}
