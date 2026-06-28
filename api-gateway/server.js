const express = require('express');
const multer = require('multer');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Load gRPC Proto
const PROTO_PATH = path.join(__dirname, 'proto', 'detection.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const detectorService = protoDescriptor.yolorpc.Detector;

// Create gRPC client
const grpcMaxMessageLength = 32 * 1024 * 1024; // 32MB
const client = new detectorService(
  'localhost:50051',
  grpc.credentials.createInsecure(),
  {
    'grpc.max_receive_message_length': grpcMaxMessageLength,
    'grpc.max_send_message_length': grpcMaxMessageLength
  }
);

// HTTP Endpoint for detection
app.post('/detect', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Please upload a file with the key "image".' });
  }

  const request = {
    image: req.file.buffer
  };

  client.Detect(request, (error, response) => {
    if (error) {
      console.error('gRPC Error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(response);
  });
});

app.listen(port, () => {
  console.log(`API Gateway listening at http://localhost:${port}`);
  console.log(`Forwarding gRPC requests to localhost:50051`);
});
