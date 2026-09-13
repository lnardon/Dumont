package container

import (
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

	AuthModule "Dumont/modules/auth"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/docker/go-connections/nat"
	"github.com/gorilla/websocket"
)

func newDockerClient() (*client.Client, error) {
    return client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.42"))
}

func newNegotiatedDockerClient() (*client.Client, error) {
    return client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
}

func StartContainer(w http.ResponseWriter, r *http.Request) {
    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
        return
    }
    defer r.Body.Close()

    cli, err := newDockerClient()
    if err != nil {
        http.Error(w, fmt.Sprintf("Error creating Docker client: %s", err), http.StatusInternalServerError)
        return
    }
    defer cli.Close()

    ctx := context.Background()
    portBindings := nat.PortMap{}
    if req.Ports != "" {
        portParts := strings.Split(req.Ports, ":")
        if len(portParts) != 2 || portParts[0] == "" || portParts[1] == "" {
            http.Error(w, "Error parsing ports: expected format <host_port>:<container_port>", http.StatusBadRequest)
            return
        }
        hostPort := portParts[0]
        containerPort := portParts[1] + "/tcp"
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
        Env:  validEnv,
    }, &container.HostConfig{
        PortBindings: portBindings,
        Binds:        validVolumes,
        RestartPolicy: restartPolicy,
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
                Env:  validEnv,
            }, &container.HostConfig{
                PortBindings: portBindings,
                Binds:        validVolumes,
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

    if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
        http.Error(w, fmt.Sprintf("Error starting container: %s", err), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    fmt.Fprintf(w, "Container started successfully: %s\n", resp.ID)
}


func StopContainer(w http.ResponseWriter, r *http.Request) {
	var req ContainerActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := newDockerClient()
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
	var req ContainerActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := newDockerClient()
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
	var req ContainerActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.RepoURL == "" || strings.HasPrefix(req.RepoURL, "-") {
		http.Error(w, "Invalid repo_url", http.StatusBadRequest)
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
	cli, err := newDockerClient()
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

	var req ContainerActionRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error decoding request body: %s", err), http.StatusBadRequest)
		return
	}

	cli, err := newDockerClient()
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
	var req ContainerActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	cli, err := newDockerClient()
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

	if err := cli.ContainerRemove(ctx, req.ContainerId, types.ContainerRemoveOptions{}); err != nil {
		http.Error(w, fmt.Sprintf("Error removing container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Container removed successfully")
}

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func parseHandshake(rawMessage string) (containerID string, token string, err error) {
    parts := strings.SplitN(rawMessage, "|", 2)
    if len(parts) != 2 {
        return "", "", fmt.Errorf("invalid handshake format")
    }

    containerPart := strings.SplitN(parts[0], ":", 2)
    if len(containerPart) != 2 || containerPart[0] != "container_id" {
        return "", "", fmt.Errorf("invalid container_id format")
    }

    tokenPart := strings.SplitN(parts[1], ":", 2)
    if len(tokenPart) != 2 || tokenPart[0] != "token" {
        return "", "", fmt.Errorf("invalid token format")
    }

    return containerPart[1], tokenPart[1], nil
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

    container_id, token, err := parseHandshake(string(firstMsg))
    if err != nil {
        log.Printf("invalid handshake: %v", err)
        conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "invalid handshake"))
        return
    }

    parsedToken, err := AuthModule.ValidateToken(token)
    if err != nil || !parsedToken.Valid {
        log.Printf("unauthorized terminal connection attempt")
        conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "unauthorized"))
        return
    }

    cli, err := newNegotiatedDockerClient()
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
    cli, err := newNegotiatedDockerClient()
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

    containerID, token, err := parseHandshake(string(firstMsg))
    if err != nil {
        log.Printf("invalid handshake: %v", err)
        conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "invalid handshake"))
        return
    }

    parsedToken, err := AuthModule.ValidateToken(token)
    if err != nil || !parsedToken.Valid {
        log.Printf("unauthorized logs connection attempt")
        conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "unauthorized"))
        return
    }

    cli, err := newNegotiatedDockerClient()
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
        buffer := make([]byte, 4096)
        for {
            n, err := logStream.Read(buffer)
            if err != nil {
                log.Printf("read from Docker logs error: %v", err)
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