package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

func generateJWT(signingKey string) (string, error) {
    token := jwt.New(jwt.SigningMethodHS256)
    claims := token.Claims.(jwt.MapClaims)
    claims["exp"] = time.Now().Add(15 * time.Minute).Unix()
    claims["authorized"] = true
    claims["user"] = "admin"

    tokenString, err := token.SignedString([]byte(signingKey))
    if err != nil {
        return "", err
    }

    return tokenString, nil
}

func generateSigningKey() (string, error) {
    key := make([]byte, 32)
    if _, err := rand.Read(key); err != nil {
        return "", err
    }
    return base64.StdEncoding.EncodeToString(key), nil
}

func ValidateToken(tokenString string) (*jwt.Token, error) {
    creds, err := loadCredentials()
    if err != nil {
        return nil, fmt.Errorf("not configured")
    }

    return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(creds.SigningKey), nil
    })
}

func VerifyJWT(endpointHandler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Header["Authorization"] != nil {
            token, err := ValidateToken(r.Header["Authorization"][0])

            if err != nil {
                http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
                return
            }

            if token.Valid {
                endpointHandler(w, r)
            } else {
                http.Error(w, "Unauthorized: Invalid Token", http.StatusUnauthorized)
            }
        } else {
            http.Error(w, "Unauthorized: No Token in Request", http.StatusUnauthorized)
        }
    }
}

func SetupStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET requests are allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"configured": IsConfigured()})
}

func Setup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	username := strings.TrimSpace(req.Username)
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters long", http.StatusBadRequest)
		return
	}
	if req.Password != req.ConfirmPassword {
		http.Error(w, "Passwords do not match", http.StatusBadRequest)
		return
	}

	if IsConfigured() {
		http.Error(w, "Setup has already been completed", http.StatusConflict)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error hashing password: %s", err), http.StatusInternalServerError)
		return
	}

	signingKey, err := generateSigningKey()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error generating signing key: %s", err), http.StatusInternalServerError)
		return
	}

	creds := &Credentials{
		Username:     username,
		PasswordHash: string(passwordHash),
		SigningKey:   signingKey,
	}

	if err := saveCredentialsExclusive(creds); err != nil {
		if os.IsExist(err) {
			http.Error(w, "Setup has already been completed", http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf("Error saving credentials: %s", err), http.StatusInternalServerError)
		return
	}

	token, err := generateJWT(creds.SigningKey)
	if err != nil {
		log.Println("Error generating JWT", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(token))
}

func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
		return
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	creds, err := loadCredentials()
	if err != nil {
		http.Error(w, "Not configured: complete setup first", http.StatusBadRequest)
		return
	}

	if req.Username != creds.Username {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

    token, err := generateJWT(creds.SigningKey)
    if err != nil {
        log.Println("Error generating JWT", err)
        w.WriteHeader(http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(token))
}
