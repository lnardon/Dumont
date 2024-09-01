FRONTEND_DIR=./frontend/react
SERVER_FILES=main.go
PORT=3322

build-frontend:
	cd $(FRONTEND_DIR) && npm install && npm run build

run-server:
	go build $(SERVER_FILES) && ./main

all: build-frontend run-server