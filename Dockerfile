# Simple development-focused Dockerfile
FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Set development environment
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
