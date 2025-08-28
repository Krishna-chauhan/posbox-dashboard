# Docker Setup for React Dashboard with FastAPI Backend

This guide provides step-by-step instructions to build and run the React Dashboard application with FastAPI backend using Docker.

## 📋 Prerequisites

- Docker installed on your system
- Git (to clone the repository)

## 🚀 Quick Start

### 1. Start FastAPI Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python backend_example.py
```

The FastAPI backend will be available at:
- **http://localhost:8000**
- **API Documentation:** http://localhost:8000/docs

### 2. Build the React Docker Image

```bash
# Build the Docker image
docker build -t dashboard-app .
```

### 3. Run the React Container

```bash
# Run the container on port 8080
docker run -d -p 8080:80 --name dashboard-container dashboard-app
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### 5. Login Credentials

Use these demo credentials:
- **Email:** admin@example.com
- **Password:** admin123

## 📁 Project Structure

```
dashboard1/
├── Dockerfile              # Docker configuration
├── .dockerignore          # Files to exclude from Docker build
├── package.json           # Node.js dependencies
├── src/                   # React source code
└── public/               # Static assets
```

## 🔧 Docker Configuration

### Dockerfile
The project uses a multi-stage build:
- **Build Stage:** Node.js 16 with build dependencies
- **Production Stage:** Nginx serving the built React app

### Key Features:
- ✅ Handles deprecated `node-sass` dependencies
- ✅ Disables ESLint during build to avoid linting errors
- ✅ Uses legacy peer deps for compatibility
- ✅ Optimized production build with Nginx

## 🛠️ Detailed Steps

### Step 1: Clone and Navigate
```bash
# Navigate to project directory
cd dashboard
```

### Step 2: Build Docker Image
```bash
# Build the image (this may take several minutes)
docker build -t dashboard-app .
```

**What happens during build:**
1. Downloads Node.js 16 base image
2. Installs build dependencies (Python3, make, g++, git)
3. Copies package.json and installs dependencies
4. Copies source code and builds the React application
5. Creates production image with Nginx

### Step 3: Run Container
```bash
# Remove any existing container with same name
docker rm -f dashboard-container

# Run the container
docker run -d -p 8080:80 --name dashboard-container dashboard-app
```

### Step 4: Verify and Access
```bash
# Check container status
docker ps

# View container logs
docker logs dashboard-container
```

## 🌐 Access URLs

### Local Access:
- **http://localhost:8080**

### Network Access (from other devices):
- **http://YOUR_IP:8080**

To find your IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 🐳 Docker Commands Reference

### Container Management
```bash
# Start container
docker start dashboard-container

# Stop container
docker stop dashboard-container

# Restart container
docker restart dashboard-container

# Remove container
docker rm -f dashboard-container
```

### Image Management
```bash
# List images
docker images

# Remove image
docker rmi dashboard-app

# Build with no cache
docker build --no-cache -t dashboard-app .
```

### Logs and Debugging
```bash
# View container logs
docker logs dashboard-container

# Follow logs in real-time
docker logs -f dashboard-container

# Execute commands in container
docker exec -it dashboard-container sh
```

## 🔍 Troubleshooting

### Common Issues:

1. **Port Already in Use**
   ```bash
   # Use different port
   docker run -d -p 8081:80 --name dashboard-container dashboard-app
   ```

2. **Container Name Conflict**
   ```bash
   # Remove existing container
   docker rm -f dashboard-container
   ```

3. **Build Failures**
   ```bash
   # Clean build
   docker build --no-cache -t dashboard-app .
   ```

4. **Permission Issues**
   ```bash
   # Run with sudo if needed
   sudo docker build -t dashboard-app .
   ```

### Build Issues:
- **node-sass errors:** Handled automatically in Dockerfile
- **ESLint errors:** Disabled during build with `DISABLE_ESLINT_PLUGIN=true`
- **Python dependencies:** Installed automatically in build stage

## 📊 Performance

### Container Stats:
```bash
# Monitor container resources
docker stats dashboard-container
```

### Image Size:
- Build stage: ~1GB (includes Node.js and dependencies)
- Production stage: ~50MB (Nginx + built React app)

## 🔄 Development Workflow

### For Development:
1. Make changes to React code
2. Rebuild Docker image: `docker build -t dashboard-app .`
3. Restart container: `docker restart dashboard-container`

### For Production:
1. Build image: `docker build -t dashboard-app .`
2. Run with restart policy: `docker run -d -p 8080:80 --restart unless-stopped --name dashboard-container dashboard-app`

## 🎯 Summary

✅ **Docker Image:** `dashboard-app`  
✅ **Container:** `dashboard-container`  
✅ **Port:** 8080  
✅ **URL:** http://localhost:8080  
✅ **Status:** Production-ready with Nginx  

Your React Dashboard is now running successfully in Docker! 🎉
