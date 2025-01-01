package group

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func HandleSaveAndDeployGroup(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}

	var req SaveAndDeployRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	err = os.MkdirAll(fmt.Sprintf("./groups/%s", req.Name), 0755)
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

	cmd := exec.Command("docker-compose", "-f", fmt.Sprintf("./groups/%s/%s.yml", req.Name, req.Name), "up", "-d")

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		log.Printf("||> Run failed with %s\n %s \n %s", stderr.String(), out.String(), err)
		http.Error(w, "Error running docker-compose: "+stderr.String(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
