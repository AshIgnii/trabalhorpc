# yolorpc

Detecção de objetos com YOLO (Ultralytics) exposta via gRPC. O servidor recebe
os bytes de uma imagem e devolve as detecções com label, confiança e bounding box.

## Setup

```bash
uv sync
```

Na primeira execução o modelo (`yolo11n.pt`) é baixado automaticamente pela Ultralytics.

## Rodar o servidor

```bash
uv run main.py                 # [::]:50051 com yolo11n.pt
uv run main.py --port 50071 --model yolo11n.pt
```

Configuração também via variáveis de ambiente: `YOLORPC_MODEL`, `YOLORPC_CONF`, `YOLORPC_IOU`.

## Cliente de exemplo

```bash
uv run client.py caminho/da/imagem.jpg localhost:50051
```

Saída:

```
Imagem 810x1080 - 5 detecção(ões):
  bus (0.94) [21, 231, 807, 734]
  person (0.88) [671, 394, 810, 878]
  ...
```

## API gRPC

Definida em [`proto/detection.proto`](proto/detection.proto):

- `Detector.Detect(DetectRequest) -> DetectResponse`
  - `DetectRequest`: `image` (bytes JPEG/PNG), `conf` e `iou` opcionais.
  - `DetectResponse`: lista de `Detection` (`classId`, `label`, `confidence`, `box`) + `width`/`height`.

## Regenerar os stubs

```bash
uv run python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. proto/detection.proto
```
