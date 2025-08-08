FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Cloudflare Worker types
RUN npm run cf-typegen || echo "Skipping type generation in container"

# Expose port for local development
EXPOSE 8787

# Command to run the server in development mode
CMD ["npm", "run", "dev"]
