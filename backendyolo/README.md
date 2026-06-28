# yolorpc

Detecção de objetos com YOLO exposta via gRPC.

## Setup

```bash
uv sync
```

## Rodar o servidor

```bash
uv run main.py
```

## Regenerar os stubs

```bash
uv run python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. proto/detection.proto
```

## Rodar backend node

```bash
node server.js
```

## Rodar interface web

```bash
python -m http.server 8080
```