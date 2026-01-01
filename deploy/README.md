# Deployment Guide

Follow these steps to deploy the IITD Timetable Generator to an AWS EC2 instance (Ubuntu).

## Option 1: Docker Deployment (Recommended)

This method uses Docker to containerize the application and automatically handle SSL certificates with Certbot.

### Prerequisites
1.  Docker and Docker Compose installed on the server.
2.  A domain name pointing to your server's IP.

### Step 1: Transfer Files
Copy the necessary files to your server:

```bash
# Copy Docker config and scripts
scp -i key.pem Dockerfile docker-compose.yml init-letsencrypt.sh ubuntu@your-server-ip:~/app/

# Copy application source code
scp -i key.pem -r deploy src public package.json package-lock.json ubuntu@your-server-ip:~/app/
```

### Step 2: Initialize SSL
SSH into your server and run the initialization script. **Edit the script first to set your domain and email.**

```bash
cd ~/app
chmod +x init-letsencrypt.sh
sudo ./init-letsencrypt.sh
```

### Step 3: Deploy
Start the application:

```bash
sudo docker-compose up -d
```

---

## Option 2: Manual Deployment

Follow these steps to manually install Nginx and deploy the build artifacts.

### Prerequisites
1.  An AWS EC2 instance running Ubuntu.
2.  SSH access to the instance.

### Step 1: Build the Application
On your local machine:

```bash
npm run build
```

### Step 2: Transfer Files
Copy the build files and script to your server:

```bash
scp -i key.pem -r build ubuntu@your-server-ip:~/
scp -i key.pem -r deploy ubuntu@your-server-ip:~/
```

### Step 3: Server Setup
SSH into your server:

```bash
ssh -i key.pem ubuntu@your-server-ip
```

Move files and run the setup script:

```bash
sudo rm -rf /var/www/html/*
sudo mv ~/build/* /var/www/html/

cd ~/deploy
chmod +x setup.sh
sudo ./setup.sh
```
