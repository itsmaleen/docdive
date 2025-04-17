FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate gRPC code
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/markdown_chunker.proto

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose gRPC port
EXPOSE 50051

# Run the gRPC server
CMD ["python", "server.py"]
