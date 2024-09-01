package hardware

type ServerStats struct {
    CPUUsage      []string `json:"cpu_usage"`
    CPUClockSpeed float64  `json:"cpuClockSpeed"`
    RAMUsage      string   `json:"ram_usage"`
    TotalStorage  float64  `json:"totalStorage"`
    UsedStorage   float64  `json:"usedStorage"`
}

type CpuStat struct {
    coreID string
    total  uint64
    idle   uint64
}