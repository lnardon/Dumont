package auth

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func dataDir() string {
	if dir := os.Getenv("DUMONT_DATA_DIR"); dir != "" {
		return dir
	}
	return "./data"
}

func credentialsPath() string {
	return filepath.Join(dataDir(), "credentials.json")
}

func IsConfigured() bool {
	_, err := os.Stat(credentialsPath())
	return err == nil
}

func loadCredentials() (*Credentials, error) {
	data, err := os.ReadFile(credentialsPath())
	if err != nil {
		return nil, err
	}

	var creds Credentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, err
	}

	return &creds, nil
}

func saveCredentialsExclusive(creds *Credentials) error {
	if err := os.MkdirAll(dataDir(), 0700); err != nil {
		return err
	}

	file, err := os.OpenFile(credentialsPath(), os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewEncoder(file).Encode(creds)
}
