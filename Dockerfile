FROM node:18-alpine

# Install HylaFAX+ client tools
RUN apk add --no-cache hylafax-client

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Create storage directory
RUN mkdir -p /data/faxjsgw

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV STORAGE_DIR=/data/faxjsgw

# Run the server
CMD ["node", "server.js"]
