FRONTEND_DIR=./frontend/react
GO_DIR=.
SERVER_FILE=main.go
PORT=3322

build-frontend:
	cd $(FRONTEND_DIR) && npm install && npm run build

run-server:
	cd $(GO_DIR) && go run $(SERVER_FILE)

all: build-frontend run-server