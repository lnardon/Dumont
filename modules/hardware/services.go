package hardware

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"golang.org/x/net/context"
)

func HandleHardwareInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET requests are allowed", http.StatusMethodNotAllowed)
		return
	}

	cpuUsages, err := getCPUUsage()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting CPU usage: %s", err), http.StatusInternalServerError)
		return
	}

	cpuClockSpeed, err := getCPUClockSpeed()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting CPU clock speed: %s", err), http.StatusInternalServerError)
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

	stats := ServerStats{
		CPUUsage:      cpuUsages,
		CPUClockSpeed: cpuClockSpeed,
		RAMUsage:      ramUsage,
		TotalStorage:  totalStorage,
		UsedStorage:   usedStorage,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func getCPUUsage() ([]string, error) {
	firstMeasures, err := readCPUStat()
	if err != nil {
		return nil, err
	}
	if len(firstMeasures) == 0 {
		return nil, fmt.Errorf("no cpu data available")
	}

	time.Sleep(500 * time.Millisecond)
	secondMeasures, err := readCPUStat()
	if err != nil {
		return nil, err
	}
	if len(secondMeasures) == 0 {
		return nil, fmt.Errorf("no cpu data available on second measure")
	}

	var cpuUsages []string
	for i, firstMeasure := range firstMeasures {
		if i >= len(secondMeasures) {
			continue
		}
		secondMeasure := secondMeasures[i]
		totalDelta := secondMeasure.total - firstMeasure.total
		idleDelta := secondMeasure.idle - firstMeasure.idle
		cpuUsage := 100.0 * (float64(totalDelta) - float64(idleDelta)) / float64(totalDelta)
		cpuUsages = append(cpuUsages, fmt.Sprintf("CPU%s: %.2f%%", firstMeasure.coreID, cpuUsage))
	}
	return cpuUsages, nil
}

func readCPUStat() ([]CpuStat, error) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(data), "\n")
	var stats []CpuStat
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 0 && strings.HasPrefix(fields[0], "cpu") {
			numFields := len(fields)
			if numFields < 5 {
				continue
			}
			var total uint64
			var idle uint64
			for i := 1; i < numFields; i++ {
				val, err := strconv.ParseUint(fields[i], 10, 64)
				if err != nil {
					return nil, err
				}
				total += val
				if i == 4 {
					idle = val
				}
			}
			coreID := fields[0][3:]
			stats = append(stats, CpuStat{coreID: coreID, total: total, idle: idle})
		}
	}
	if len(stats) == 0 {
		return nil, fmt.Errorf("no cpu core info found")
	}
	return stats, nil
}

func getCPUClockSpeed() (float64, error) {
	file, err := os.Open("/proc/cpuinfo")
	if err != nil {
		return 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "cpu MHz") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				speedStr := strings.TrimSpace(parts[1])
				speed, err := strconv.ParseFloat(speedStr, 64)
				if err != nil {
					return 0, err
				}
				return speed, nil
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return 0, err
	}

	return 0, fmt.Errorf("CPU clock speed not found")
}

func getRAMUsage() (string, error) {
	out, err := os.ReadFile("/proc/meminfo")
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
	usedStorage := float64(stat.Blocks-stat.Bfree) * float64(stat.Bsize)
	return totalStorage, usedStorage, nil
}

func HandleGetNetworks(w http.ResponseWriter, r *http.Request) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		http.Error(w, "Failed to create Docker client: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cli.Close()

	networks, err := cli.NetworkList(context.Background(), types.NetworkListOptions{})
	if err != nil {
		http.Error(w, "Failed to list Docker networks: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(networks); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
	}
}
