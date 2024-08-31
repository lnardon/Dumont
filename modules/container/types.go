package container

type CloneRequest struct {
	RepoURL string `json:"repo_url"`
	Port string `json:"container_port"`
	ContainerId string `json:"container_id"`
	ContainerName string `json:"container_name"`
}

type CreateRequest struct {
	ContainerName   string `json:"container_name"`
	Ports           string `json:"ports"`
	Image           string `json:"image"`
	Variables     []string `json:"variables,omitempty"`
	Volumes       []string `json:"volumes,omitempty"`
	RestartPolicy string   `json:"restartPolicy,omitempty"`
}