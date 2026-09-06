FROM openjdk:17-jdk-slim

# Install Node.js & core utilities
RUN apt-get update && apt-get install -y curl procps && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create non-root restricted user for untrusted student code execution
RUN useradd -m sandbox

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Grant permissions for temporary folder access
RUN chmod 777 /tmp

EXPOSE 3000
CMD ["npm", "start"]