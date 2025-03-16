# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -m nltk.downloader stopwords

# Copy source code
COPY . .

# Generate gRPC code
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/tfidf.proto

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose gRPC port
EXPOSE 50051

# Run the gRPC server
CMD ["python", "server.py"]
