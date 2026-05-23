export type EffectType = 'demon-eyes' | 'fangs' | 'horns' | 'full-demon' | 'ghost';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  // MediaPipe 人脸关键点索引对应
  rightEye: { x: number; y: number };
  leftEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  rightEarTragion: { x: number; y: number };
  leftEarTragion: { x: number; y: number };
}

export interface DetectionResult {
  boundingBox: FaceBoundingBox;
  landmarks: FaceLandmarks;
}

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  features: {
    horns?: boolean;
    wings?: boolean;
    fangs?: boolean;
    fire?: boolean;
    halo?: boolean;
    glowingEyes?: boolean;
  };
}
