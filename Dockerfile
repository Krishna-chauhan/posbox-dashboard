# Multi-stage build for React Dashboard
# Stage 1: Build stage (alpine = much smaller, faster pull)
FROM node:16-alpine AS build

# No native build tools needed (sass is pure JS)

# Set working directory
WORKDIR /app

# Build args - passed from docker-compose, read from .env
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_PROJECT_NAME
ARG REACT_APP_APP_TITLE
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_PROJECT_NAME=$REACT_APP_PROJECT_NAME
ENV REACT_APP_APP_TITLE=$REACT_APP_APP_TITLE

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production
RUN npm install --legacy-peer-deps

# Copy .env file
COPY .env ./

# Copy source code
COPY . .

# Build the application with environment variables (disable ESLint for build)
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