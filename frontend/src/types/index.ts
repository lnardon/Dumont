export interface Port {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
}

interface NetworkConfig {
  IPAMConfig: null;
  Links: null;
  Aliases: null;
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  MacAddress: string;
  DriverOpts: null;
}

interface Networks {
  [networkName: string]: NetworkConfig;
}

export interface ContainerInfo {
  Names: string;
  Status: string;
  Ports: Port[];
  Id: string;
  Image: string;
  Networks: string;
  Size: string;
  NetworkSettings?: Networks;
  Created?: number;
}

interface Stats {
  active_anon: number;
  active_file: number;
  anon: number;
  anon_thp: number;
  file: number;
  file_dirty: number;
  file_mapped: number;
  file_writeback: number;
  inactive_anon: number;
  inactive_file: number;
  kernel_stack: number;
  pgactivate: number;
  pgdeactivate: number;
  pgfault: number;
  pglazyfree: number;
  pglazyfreed: number;
  pgmajfault: number;
  pgrefill: number;
  pgscan: number;
  pgsteal: number;
  shmem: number;
  slab: number;
  slab_reclaimable: number;
  slab_unreclaimable: number;
  sock: number;
  thp_collapse_alloc: number;
  thp_fault_alloc: number;
  unevictable: number;
  workingset_activate: number;
  workingset_nodereclaim: number;
  workingset_refault: number;
}

interface MemoryStats {
  usage: number;
  stats: Stats;
  limit: number;
}

interface CPUUsage {
  total_usage: number;
  usage_in_kernelmode: number;
  usage_in_usermode: number;
}

interface ThrottlingData {
  periods: number;
  throttled_periods: number;
  throttled_time: number;
}

interface CPUStats {
  cpu_usage: CPUUsage;
  system_cpu_usage: number;
  online_cpus: number;
  throttling_data: ThrottlingData;
}

interface IOServiceBytesRecursive {
  major: number;
  minor: number;
  op: string;
  value: number;
}

interface BlkioStats {
  io_service_bytes_recursive: IOServiceBytesRecursive[];
  io_serviced_recursive: null;
  io_queue_recursive: null;
  io_service_time_recursive: null;
  io_wait_time_recursive: null;
  io_merged_recursive: null;
  io_time_recursive: null;
  sectors_recursive: null;
}

interface NetworkTraffic {
  rx_bytes: number;
  rx_packets: number;
  rx_errors: number;
  rx_dropped: number;
  tx_bytes: number;
  tx_packets: number;
  tx_errors: number;
  tx_dropped: number;
}

interface StatsNetworks {
  [interfaceName: string]: NetworkTraffic;
}

export interface ContainerStats {
  read: string;
  preread: string;
  pids_stats: {
    current: number;
    limit: number;
  };
  blkio_stats: BlkioStats;
  num_procs: number;
  storage_stats: Record<string, unknown>;
  cpu_stats: CPUStats;
  precpu_stats: CPUStats;
  memory_stats: MemoryStats;
  name: string;
  id: string;
  networks: StatsNetworks;
}
