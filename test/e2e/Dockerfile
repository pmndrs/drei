# Use the mcr.microsoft.com/playwright image as the base image
FROM mcr.microsoft.com/playwright

# Set the working directory
WORKDIR /app

# Copy the e2e.sh and snapshot.test.js files into the container
COPY e2e.sh snapshot.test.js /app/

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Run the e2e.sh script
CMD ["./e2e.sh"]
