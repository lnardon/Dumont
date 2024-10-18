FROM node:22.0-alpine3.19 as base
WORKDIR /app
COPY ./frontend/react/package*.json ./
RUN npm install

FROM base as build-frontend
WORKDIR /app
COPY ./frontend/react .
RUN npm run build

FROM golang:1.23.0-alpine3.19 AS build-backend
WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:3.19 AS runner
WORKDIR /usr/src/app
COPY --from=build-frontend /app/dist /usr/src/app/dist
COPY --from=build-backend /usr/src/app/main /usr/src/app/main

EXPOSE 3323
CMD ["./main"]
