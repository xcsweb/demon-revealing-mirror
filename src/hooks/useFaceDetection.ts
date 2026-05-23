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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoElement) return;

    let faceDetection: FaceDetection;
    let mounted = true;
    
    const initFaceDetection = async () => {
      try {
        faceDetection = new FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${file}`
        });
        
        if (!mounted) {
          faceDetection.close();
          return;
        }
        
        faceDetectionRef.current = faceDetection;

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.3
        });

        faceDetection.onResults((results) => {
          if (!mounted) return;
          
          if (results.detections.length > 0) {
            const detection = results.detections[0] as any;
            options.onFaceDetected(detection.boundingBox, detection.keypoints);
          } else {
            options.onFaceLost();
          }
        });

        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('人脸检测初始化失败:', err);
        if (mounted) {
          setError('人脸检测初始化失败，请刷新页面重试');
          setIsLoading(false);
        }
      }
    };

    initFaceDetection();

    const detect = async () => {
      if (!videoElement || !faceDetectionRef.current || !mounted) return;
      
      if (videoElement.readyState >= 2) {
        try {
          await faceDetectionRef.current.send({ image: videoElement });
        } catch (err) {
          // 忽略检测错误，继续检测
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    const startDetection = () => {
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    const timeoutId = setTimeout(startDetection, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameRef.current);
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
        faceDetectionRef.current = null;
      }
    };
  }, [videoElement, options]);

  return { isReady, error, isLoading };
}