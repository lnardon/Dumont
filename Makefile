FRONTEND_DIR=./frontend/react
GO_DIR=.
SERVER_FILES=main.go container.go hardware.go auth.go group.go
PORT=3322

build-frontend:
	cd $(FRONTEND_DIR) && npm install && npm run build

run-server:
	cd $(GO_DIR) && go build $(SERVER_FILES) && ./main

all: build-frontend run-server