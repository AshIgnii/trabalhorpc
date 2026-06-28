import io
import logging
from concurrent import futures
import grpc
import numpy as np
from PIL import Image
from ultralytics import YOLO

from proto import detection_pb2
from proto import detection_pb2_grpc

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("backend yolo")

MODEL = "yolo11n.pt"
CONF = 0.25
IOU = 0.45
PORT = 50051
MAX_MESSAGE_BYTES = 32 * 1024 * 1024

class DetectorServicer(detection_pb2_grpc.DetectorServicer):
    def __init__(self):
        logger.info("Carregando modelo: %s", MODEL)
        self.model = YOLO(MODEL)
        self.names = self.model.names
        logger.info("Modelo pronto (%d classes)", len(self.names))

    def Detect(self, request, context):
        if not request.image:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "imagem vazia")

        image = None
        try:
            image = Image.open(io.BytesIO(request.image)).convert("RGB")
        except Exception as err:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, f"imagem inválida: {err}")

        frame = np.asarray(image)
        results = self.model.predict(frame, conf=CONF, iou=IOU, verbose=False)
        result = results[0]

        detections = []
        for box in result.boxes:
            classId = int(box.cls[0])
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0])
            detections.append(
                detection_pb2.Detection(
                    label=self.names.get(classId, str(classId)),
                    confidence=float(box.conf[0]),
                    box=detection_pb2.BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                )
            )

        logger.info("Detectados %d objetos", len(detections))
        return detection_pb2.DetectResponse(
            detections=detections,
            width=image.width,
            height=image.height,
        )

def main():
    options = [
        ("grpc.max_receive_message_length", MAX_MESSAGE_BYTES),
        ("grpc.max_send_message_length", MAX_MESSAGE_BYTES),
    ]
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4), options=options)
    detection_pb2_grpc.add_DetectorServicer_to_server(DetectorServicer(), server)
    server.add_insecure_port(f"[::]:{PORT}")
    server.start()
    logger.info("Servidor gRPC ouvindo na porta %d", PORT)
    server.wait_for_termination()

if __name__ == "__main__":
    main()
