---
layout: ../../layouts/BlogLayout.astro
title: "Computer Vision: Implementando Detección de Objetos en Tiempo Real"
description: "Aprende a implementar sistemas de detección de objetos usando YOLO y OpenCV en aplicaciones web."
date: "2025-10-20"
category: "IA"
readTime: "14 min"
author: "Equipo Aquí Creamos"
image: "/img/fondo.png"
---

## Introducción a Computer Vision

La **visión por computadora** permite que las máquinas "vean" e interpreten el mundo visual. En 2025, con modelos como YOLO v8 y avances en hardware, podemos hacer detección de objetos en tiempo real incluso en navegadores web.

En este tutorial, implementaremos un sistema completo de detección de objetos.

## Arquitectura del Sistema

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cámara    │────▶│  Preproceso  │────▶│  Modelo AI  │
│  /Video     │     │   (OpenCV)   │     │   (YOLO)    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
                    ┌──────────────────────────────┐
                    │  Postproceso & Visualización │
                    │  (Bounding boxes, labels)    │
                    └──────────────────────────────┘
```

## Setup del Proyecto

### Backend (Python + FastAPI)

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install fastapi uvicorn opencv-python ultralytics pillow numpy
```

### Frontend (React + TypeScript)

```bash
npx create-react-app object-detection --template typescript
cd object-detection
npm install axios
```

## Implementación del Backend

### 1. Modelo YOLO

```python
# app/models/detector.py
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Dict, Tuple

class ObjectDetector:
    def __init__(self, model_path: str = 'yolov8n.pt'):
        """
        Inicializa el detector con YOLOv8
        Modelos disponibles: yolov8n (nano), yolov8s (small), yolov8m (medium)
        """
        self.model = YOLO(model_path)
        self.confidence_threshold = 0.5
        self.iou_threshold = 0.4

    def detect(self, image: np.ndarray) -> List[Dict]:
        """
        Detecta objetos en una imagen

        Returns:
            List de detecciones: [
                {
                    'class': 'person',
                    'confidence': 0.95,
                    'bbox': [x1, y1, x2, y2]
                },
                ...
            ]
        """
        results = self.model(
            image,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            verbose=False
        )

        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Extraer información
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                })

        return detections

    def draw_detections(
        self,
        image: np.ndarray,
        detections: List[Dict]
    ) -> np.ndarray:
        """Dibuja bounding boxes en la imagen"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            label = f"{det['class']} {det['confidence']:.2f}"

            # Dibujar rectángulo
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Dibujar label con fondo
            (text_width, text_height), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                image,
                (x1, y1 - text_height - 10),
                (x1 + text_width, y1),
                (0, 255, 0),
                -1
            )
            cv2.putText(
                image, label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1
            )

        return image
```

### 2. API con FastAPI

```python
# app/main.py
from fastapi import FastAPI, File, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import base64
import asyncio

from app.models.detector import ObjectDetector

app = FastAPI(title="Object Detection API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar detector
detector = ObjectDetector('yolov8n.pt')

@app.post("/api/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Endpoint para detectar objetos en una imagen
    """
    # Leer imagen
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Detectar objetos
    detections = detector.detect(image)

    # Dibujar detecciones
    image_with_boxes = detector.draw_detections(image.copy(), detections)

    # Convertir a bytes
    _, buffer = cv2.imencode('.jpg', image_with_boxes)
    io_buf = BytesIO(buffer)

    return StreamingResponse(io_buf, media_type="image/jpeg")

@app.websocket("/ws/video")
async def video_detection(websocket: WebSocket):
    """
    WebSocket para detección en tiempo real desde video
    """
    await websocket.accept()

    try:
        while True:
            # Recibir frame del cliente
            data = await websocket.receive_text()

            # Decodificar base64
            img_data = base64.b64decode(data.split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Detectar
            detections = detector.detect(frame)

            # Enviar solo las detecciones (sin imagen procesada para performance)
            await websocket.send_json({
                'detections': detections,
                'timestamp': asyncio.get_event_loop().time()
            })

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()

@app.get("/api/classes")
async def get_classes():
    """Retorna las clases que el modelo puede detectar"""
    return {
        'classes': list(detector.model.names.values()),
        'count': len(detector.model.names)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Implementación del Frontend

### 1. Componente de Detección en Imagen

```tsx
// src/components/ImageDetection.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

export function ImageDetection() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setResultImage('');
    }
  };

  const detectObjects = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/detect',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob'
        }
      );

      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);
    } catch (error) {
      console.error('Error detecting objects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-detection">
      <h2>Detección en Imagen</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />

      <button
        onClick={detectObjects}
        disabled={!selectedImage || loading}
      >
        {loading ? 'Detectando...' : 'Detectar Objetos'}
      </button>

      {resultImage && (
        <div className="result">
          <h3>Resultado:</h3>
          <img src={resultImage} alt="Detection result" />
        </div>
      )}
    </div>
  );
}
```

### 2. Componente de Detección en Video en Tiempo Real

```tsx
// src/components/VideoDetection.tsx
import React, { useEffect, useRef, useState } from 'react';

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

export function VideoDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Conectar WebSocket
      wsRef.current = new WebSocket('ws://localhost:8000/ws/video');

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        processFrame();
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setDetections(data.detections);
        drawDetections(data.detections);
      };

    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const processFrame = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Capturar frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convertir a base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Enviar al servidor
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(imageData);
    }

    // Repetir cada ~100ms (10 FPS)
    setTimeout(processFrame, 100);
  };

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar video
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0);
    }

    // Dibujar detecciones
    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;

      // Rectángulo
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Label
      const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x1, y1 - 20, ctx.measureText(label).width + 10, 20);
      ctx.fillStyle = '#000';
      ctx.fillText(label, x1 + 5, y1 - 5);
    });
  };

  return (
    <div className="video-detection">
      <h2>Detección en Video en Tiempo Real</h2>

      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Detener' : 'Iniciar'} Cámara
      </button>

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
        <canvas ref={canvasRef} />
      </div>

      <div className="stats">
        <p>Objetos detectados: {detections.length}</p>
        <ul>
          {detections.map((det, i) => (
            <li key={i}>
              {det.class}: {(det.confidence * 100).toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Optimizaciones de Rendimiento

### 1. Reducir Tamaño de Imagen

```python
def preprocess_image(image: np.ndarray, max_size: int = 640) -> np.ndarray:
    """Redimensiona imagen manteniendo aspect ratio"""
    h, w = image.shape[:2]

    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        image = cv2.resize(image, (new_w, new_h))

    return image
```

### 2. Batch Processing

```python
def detect_batch(images: List[np.ndarray]) -> List[List[Dict]]:
    """Procesa múltiples imágenes en un solo pass"""
    results = detector.model(images, stream=True)
    all_detections = []

    for result in results:
        detections = parse_results(result)
        all_detections.append(detections)

    return all_detections
```

### 3. Model Caching

```python
from functools import lru_cache

@lru_cache(maxsize=1)
def get_model(model_name: str):
    """Cachea el modelo en memoria"""
    return YOLO(model_name)
```

## Casos de Uso Reales

### 1. Conteo de Personas en Tienda

```python
def count_people(detections: List[Dict]) -> int:
    """Cuenta solo personas detectadas"""
    return sum(1 for det in detections if det['class'] == 'person')

# Análisis de flujo
people_count = count_people(detections)
if people_count > MAX_CAPACITY:
    send_alert("Capacidad máxima alcanzada")
```

### 2. Detección de EPP (Equipo de Protección Personal)

```python
def check_safety_equipment(detections: List[Dict]) -> Dict:
    """Verifica uso de casco y chaleco"""
    has_person = any(d['class'] == 'person' for d in detections)
    has_helmet = any(d['class'] == 'helmet' for d in detections)
    has_vest = any(d['class'] == 'vest' for d in detections)

    return {
        'compliant': has_person and has_helmet and has_vest,
        'missing': [
            item for item, present in [
                ('helmet', has_helmet),
                ('vest', has_vest)
            ] if not present
        ]
    }
```

### 3. Control de Inventario

```python
def track_products(detections: List[Dict], product_classes: List[str]):
    """Cuenta productos en estantería"""
    inventory = {}

    for det in detections:
        if det['class'] in product_classes:
            inventory[det['class']] = inventory.get(det['class'], 0) + 1

    return inventory
```

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Descargar modelo
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build y run
docker build -t object-detection .
docker run -p 8000:8000 object-detection
```

## Conclusión

Has aprendido a:

- ✅ Configurar YOLOv8 para detección de objetos
- ✅ Crear API REST con FastAPI
- ✅ Implementar detección en tiempo real con WebSocket
- ✅ Integrar con React para UI interactiva
- ✅ Optimizar rendimiento
- ✅ Deployar con Docker

Computer Vision está revolucionando industrias. Desde retail hasta manufactura, las posibilidades son infinitas.

---

**¿Necesitas implementar Computer Vision en tu empresa?** [Contáctanos](/#contenido10) para una consultoría gratuita.
