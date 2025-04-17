from setuptools import setup, find_packages

setup(
    name="rag-tools",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "grpcio>=1.59.0",
        "grpcio-tools>=1.59.0",
        "langchain>=0.1.12",
        "langchain-text-splitters>=0.0.1",
    ],
    python_requires=">=3.11",
)
