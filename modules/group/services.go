package group

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
)

var validGroupName = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

func HandleSaveAndDeployGroup(w http.ResponseWriter, r *http.Request){
	var req SaveAndDeployRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if !validGroupName.MatchString(req.Name) {
		http.Error(w, "Invalid group name", http.StatusBadRequest)
		return
	}

	err := os.MkdirAll(fmt.Sprintf("./groups/%s", req.Name), 0755)
	if err != nil {
		http.Error(w, "Error creating directory", http.StatusInternalServerError)
		log.Println(err)
		return
	}

	file, err := os.Create(fmt.Sprintf("./groups/%s/%s.yml", req.Name, req.Name))
	if err != nil {
		http.Error(w, "Error creating file", http.StatusInternalServerError)
		log.Println(err)
		return
	}
	defer file.Close()

	_, err = file.WriteString(req.Text)
	if err != nil {
		http.Error(w, "Error writing to file", http.StatusInternalServerError)
		return
	}

	cmd := exec.Command("docker", "compose", "-f", fmt.Sprintf("./groups/%s/%s.yml", req.Name, req.Name), "up", "-d")

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		log.Printf("||> Run failed with %s\n", stderr.String())
		http.Error(w, "Error running docker-compose: "+stderr.String(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}