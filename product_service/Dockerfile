# Use a lightweight Node.js base image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the port the service will run on
EXPOSE 8080

# Command to start the service
CMD ["node", "index.js"]
