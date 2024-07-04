# Define the base image
FROM node:20.15.0 AS builder

# Set working directory
WORKDIR /VSCODE

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy your application code
COPY . .

# Define the production image
FROM node:20.15.0

# Set working directory
WORKDIR /VSCODE

# Copy only production files (exclude development dependencies)
COPY --from=builder /VSCODE/node_modules ./node_modules
COPY . .

# Expose the port your Node.js application listens on
EXPOSE 430
## Replace 3000 with your actual port

# Start the Node.js application
CMD [ "node", "server.js" ] 
# Replace "npm start" with your actual start command
