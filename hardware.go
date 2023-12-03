package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type ServerStats struct {
	CPUUsage string `json:"cpu_usage"`
	RAMUsage string `json:"ram_usage"`
	TotalStorage   float64 `json:"totalStorage"`
	UsedStorage   float64 `json:"usedStorage"`
}

type CpuStat struct {
	total uint64
	idle  uint64
}

func HandleHardwareInfo(w http.ResponseWriter, r *http.Request) {
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

	stats := ServerStats{
		CPUUsage:      cpuUsage,
		RAMUsage:      ramUsage,
		TotalStorage:  totalStorage,
		UsedStorage:  usedStorage,
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

func readCPUStat() (CpuStat, error) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return CpuStat{}, err
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
					return CpuStat{}, err
				}
				total += val
				if i == 4 {
					idle = val
				}
			}
			return CpuStat{total: total, idle: idle}, nil
		}
	}
	return CpuStat{}, fmt.Errorf("cpu info not found")
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
    usedStorage := float64(stat.Blocks - stat.Bfree) * float64(stat.Bsize)
    return totalStorage, usedStorage, nil
}
