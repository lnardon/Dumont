package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	// "github.com/joho/godotenv"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func goDotEnvVariable(key string) string {
//   err := godotenv.Load(".env")
//   if err != nil {
//     log.Fatalf("Error loading .env file")
//   }

  return os.Getenv(key)
}

func generateJWT() (string, error) {
    token := jwt.New(jwt.SigningMethodHS256)
    claims := token.Claims.(jwt.MapClaims)
    claims["exp"] = time.Now().Add(15 * time.Minute).Unix()
    claims["authorized"] = true
    claims["user"] = "admin"

    tokenString, err := token.SignedString([]byte(goDotEnvVariable("JWT_SIGNING_KEY")))
    if err != nil {
        return "", err
    }

    return tokenString, nil
}

func verifyJWT(endpointHandler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Header["Authorization"] != nil {
            token, err := jwt.Parse(r.Header["Authorization"][0], func(token *jwt.Token) (interface{}, error) {
                if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                    return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
                }
                return []byte(goDotEnvVariable("JWT_SIGNING_KEY")), nil
            })

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

func Login(w http.ResponseWriter, r *http.Request) {
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

	var req LoginRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.Error(w, "Error parsing JSON body", http.StatusBadRequest)
		return
	}

	envUsername := goDotEnvVariable("LOGIN_USERNAME")
    envPassword := goDotEnvVariable("LOGIN_PASSWORD")
	if req.Username != envUsername || req.Password != envPassword {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}


    token, err := generateJWT()
    if err != nil {
        log.Println("Error generating JWT", err)
        w.WriteHeader(http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(token))
}