# Multi-stage build for React Dashboard
# Stage 1: Build stage
FROM node:16-bullseye AS build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (disable ESLint for build)
RUN DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]