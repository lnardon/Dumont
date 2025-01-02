FROM node:22.0.0-alpine3.19 as build-frontend
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend .
RUN npm run build

FROM golang:1.23.0-alpine3.19 AS build-backend
WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:3.19 AS runner
WORKDIR /usr/src/app
COPY --from=build-frontend /app/dist /usr/src/app/frontend/dist
COPY --from=build-backend /usr/src/app/main /usr/src/app/main
RUN apk add --no-cache docker-cli docker-cli-compose

EXPOSE 3322
CMD ["./main"]

