package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type Request struct {
	RepoURL string `json:"repo_url"`
	Port string `json:"container_port"`
	ContainerId string `json:"container_id"`
}

type ServerStats struct {
	CPUUsage string `json:"cpu_usage"`
	RAMUsage string `json:"ram_usage"`
	TotalStorage   float64 `json:"totalStorage"`
	UsedStorage   float64 `json:"usedStorage"`
	DownloadSpeed  float64 `json:"downloadSpeed"`
	UploadSpeed    float64 `json:"uploadSpeed"`
}

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend/react/dist")))   
	http.HandleFunc("/cloneRepo", handleClone)
	http.HandleFunc("/getContainerList", handleContainerList)
	http.HandleFunc("/deleteContainer", handleDeleteContainer)
	http.HandleFunc("/getHardwareInfo", handleHardwareInfo)

	fmt.Println("Server started on :3322")
	err := http.ListenAndServe(":3322", nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
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

func handleClone(w http.ResponseWriter, r *http.Request) {
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

	imageName := fmt.Sprintf("repo_image_%s", rId)
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

func handleContainerList(w http.ResponseWriter, r *http.Request) {
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

func handleDeleteContainer(w http.ResponseWriter, r *http.Request) {
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

func handleHardwareInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET requests are allowed", http.StatusMethodNotAllowed)
		return
	}

	cpuUsage, err := getCPUUsage()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting CPU usage: %s", err), http.StatusInternalServerError)
		return
	}

	ramUsage, err := getRAMUsage()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting RAM usage: %s", err), http.StatusInternalServerError)
		return
	}

	totalStorage, usedStorage, err := getTotalAndUsedStorage()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting total storage: %s", err), http.StatusInternalServerError)
		return
	}

	downloadSpeed, uploadSpeed, err := getNetworkSpeeds()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting network speeds: %s", err), http.StatusInternalServerError)
		return
	}

	stats := ServerStats{
		CPUUsage:      cpuUsage,
		RAMUsage:      ramUsage,
		TotalStorage:  totalStorage,
		UsedStorage:  usedStorage,
		DownloadSpeed: downloadSpeed,
		UploadSpeed:   uploadSpeed,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func getCPUUsage() (string, error) {
	firstMeasure, err := readCPUStat()
	if err != nil {
		return "", err
	}
	time.Sleep(500 * time.Millisecond)
	secondMeasure, err := readCPUStat()
	if err != nil {
		return "", err
	}

	totalDelta := secondMeasure.total - firstMeasure.total
	idleDelta := secondMeasure.idle - firstMeasure.idle
	cpuUsage := 100.0 * (float64(totalDelta) - float64(idleDelta)) / float64(totalDelta)
	return fmt.Sprintf("%.2f%%", cpuUsage), nil
}

type cpuStat struct {
	total uint64
	idle  uint64
}

func readCPUStat() (cpuStat, error) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return cpuStat{}, err
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if fields[0] == "cpu" {
			numFields := len(fields)
			var total uint64
			var idle uint64
			for i := 1; i < numFields; i++ {
				val, err := strconv.ParseUint(fields[i], 10, 64)
				if err != nil {
					return cpuStat{}, err
				}
				total += val
				if i == 4 { // Idle value is at the 4th position
					idle = val
				}
			}
			return cpuStat{total: total, idle: idle}, nil
		}
	}

	return cpuStat{}, fmt.Errorf("cpu info not found")
}

func getRAMUsage() (string, error) {
	out, err := ioutil.ReadFile("/proc/meminfo")
	if err != nil {
		return "", err
	}

	lines := strings.Split(string(out), "\n")
	var memTotal, memAvailable uint64
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}

		switch fields[0] {
		case "MemTotal:":
			memTotal, err = strconv.ParseUint(fields[1], 10, 64)
			if err != nil {
				return "", err
			}
		case "MemAvailable:":
			memAvailable, err = strconv.ParseUint(fields[1], 10, 64)
			if err != nil {
				return "", err
			}
		}
	}

	memUsed := memTotal - memAvailable
	ramUsage := fmt.Sprintf("%d/%dMB (%.2f%%)", memUsed/1024, memTotal/1024, 100.0*float64(memUsed)/float64(memTotal))

	return ramUsage, nil
}

func getTotalAndUsedStorage() (float64, float64, error) {
    var stat syscall.Statfs_t

    err := syscall.Statfs("/", &stat)
    if err != nil {
        return 0, 0, err
    }

    totalStorage := float64(stat.Blocks) * float64(stat.Bsize)
    usedStorage := float64(stat.Blocks - stat.Bfree) * float64(stat.Bsize)
    return totalStorage, usedStorage, nil
}

func getNetworkSpeeds() (float64, float64, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return 0, 0, err
	}

	var totalBytesSent, totalBytesRecv float64

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue // interface down
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue // loopback interface
		}

		// stats, err := iface.Addrs()
		// if err != nil {
		// 	return 0, 0, err
		// }

		// for _, stat := range stats {
		// 	// Accumulate bytes sent and received across all interfaces
		// 	// You will need to cast stat to the correct type and extract the data
		// }
	}
	return totalBytesSent, totalBytesRecv, nil
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
