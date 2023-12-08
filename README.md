<p style="text-align:center">
<img src="./images/logo.png" style="width: 10rem"/>
</p>

<p style="text-align:center; font-size: 32px; font-weight: bold">
    Dumont
</p>

<p style="text-align:center; font-size: 16px; font-weight: 400">
    Dumont is an open-source tool designed to simplify the creation and management of Docker containers via a web UI. Ideal for self-hosting, Dumont offers an intuitive interface for handling container-related tasks with ease.
</p>

<img src="./images/demo.gif" style="width: 100%"/>

## Screenshots

1- Login

<img src="./images/s0.png" style="width: 100%"/>

2- Dashboard

<img src="./images/s1.png" style="width: 100%"/>

3- View container

<img src="./images/s2.png" style="width: 100%"/>

4- Create container

<img src="./images/s3.png" style="width: 100%"/>

## Prerequisites

- Docker installed on your server.

## Installation

### Using Docker Image (Docker Hub)

1 - Pull the latest image from Docker Hub:

```bash
docker pull lnardon/dumont
```

2 - Run the Dumont container. Replace the placeholder values with your personal information:

```bash
docker run -d -e JWT_SIGNING_KEY="YOURSECRETKEYHERE" -e LOGIN_USERNAME="YOURUSERNAME" -e LOGIN_PASSWORD="YOURPASSWORD" -v /var/run/docker.sock:/var/run/docker.sock -p 3322:3322 lnardon/dumont
```

3 - Access Dumont at http://localhost:3322

### Build from source

1 - Clone the repository and build the Docker image:

```bash
git clone https://github.com/lnardon/Dumont.git && cd Dumont && docker build -t dumont .
```

2 - Start the container using the following command. Replace the placeholders with your information:

```bash
docker run -d -e JWT_SIGNING_KEY="YOURSECRETKEYHERE" -e LOGIN_USERNAME="YOURUSERNAME" -e LOGIN_PASSWORD="YOURPASSWORD" -v /var/run/docker.sock:/var/run/docker.sock -p 3322:3322 dumont

```

3 - Access Dumont at http://localhost:3322
