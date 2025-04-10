# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Generate gRPC code
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/rag.proto

# Expose the gRPC port
EXPOSE 50052

# Set environment variables
ENV PORT=50052
ENV MAX_WORKERS=10

# Run the server
CMD ["python", "server.py"] 