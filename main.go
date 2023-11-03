package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
    "math/rand"
)

type Request struct {
	RepoURL string `json:"repo_url"`
}

func main() {
    http.Handle("/", http.FileServer(http.Dir("./frontend")))   
	http.HandleFunc("/cloneRepo", handleClone)

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
	cmd := exec.Command("sudo","docker", "build", "-t", imageName, context)
	return cmd.Run()
}

func dockerRun(imageName string, port string) error {
    cmd := exec.Command("sudo","docker", "run", "-d", "-p", "8080:8080", imageName)
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

	if err := dockerRun(imageName, "3322"); err != nil {
		http.Error(w, fmt.Sprintf("Error running Docker container: %s", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
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
