FROM node:22.8.0-alpine3.19 AS build-frontend
WORKDIR /usr/src/app
COPY ./frontend/react .
RUN npm config set https-proxy http://cloud.different.tech:80
RUN npm config set proxy http://cloud.different.tech:80
RUN npm install
RUN npm install typescript --save-dev
RUN npm run build

FROM golang:1.23.0-alpine3.19 AS build-backend
WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:3.19 AS runner
WORKDIR /usr/src/app
COPY --from=build-frontend /usr/src/app/dist /usr/src/app/frontend/react/dist
COPY --from=build-backend /usr/src/app/main /usr/src/app/main

EXPOSE 3323
CMD ["./main"]
