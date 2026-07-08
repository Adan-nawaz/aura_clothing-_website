FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the server port
EXPOSE 3000

# Set environment to production and run
ENV NODE_ENV=production
CMD ["node", "server.js"]
