import { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';

interface FaceDetectionOptions {
  onFaceDetected: (box: any, landmarks: any) => void;
  onFaceLost: () => void;
}

export function useFaceDetection(videoElement: HTMLVideoElement | null, options: FaceDetectionOptions) {
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoElement) return;

    let faceDetection: FaceDetection;
    
    try {
      faceDetection = new FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${file}`
      });
      
      faceDetectionRef.current = faceDetection;

      // 降低检测阈值，提高识别率
      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.3 // 降低阈值，更容易检测到人脸
      });

      faceDetection.onResults((results) => {
        if (results.detections.length > 0) {
          const detection = results.detections[0] as any;
          options.onFaceDetected(detection.boundingBox, detection.keypoints);
        } else {
          options.onFaceLost();
        }
      });

      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize MediaPipe:', err);
      setError('人脸检测初始化失败');
      return;
    }

    const detect = async () => {
      if (videoElement.readyState >= 2 && faceDetection) {
        try {
          await faceDetection.send({ image: videoElement });
        } catch (err) {
          // 忽略检测错误
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      faceDetection.close();
    };
  }, [videoElement, options]);

  return { isReady, error };
}