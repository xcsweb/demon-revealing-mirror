import { create } from 'zustand';
import { EffectType, FaceBoundingBox } from '@/types';

interface MirrorState {
  // 摄像头状态
  cameraActive: boolean;
  facingMode: 'user' | 'environment';
  
  // 人脸检测状态
  faceDetected: boolean;
  faceBoundingBox: FaceBoundingBox | null;
  faceLandmarks: any | null;
  
  // 特效状态
  currentEffect: EffectType;
  
  // 截图状态
  capturedImage: string | null;
  
  // Actions
  setCameraActive: (active: boolean) => void;
  toggleFacingMode: () => void;
  setFaceDetected: (detected: boolean, box?: FaceBoundingBox | null, landmarks?: any) => void;
  setCurrentEffect: (effect: EffectType) => void;
  setCapturedImage: (image: string | null) => void;
}

export const useMirrorStore = create<MirrorState>((set) => ({
  cameraActive: false,
  facingMode: 'user',
  faceDetected: false,
  faceBoundingBox: null,
  faceLandmarks: null,
  currentEffect: 'full-demon',
  capturedImage: null,
  
  setCameraActive: (active) => set({ cameraActive: active }),
  toggleFacingMode: () => set((state) => ({ 
    facingMode: state.facingMode === 'user' ? 'environment' : 'user' 
  })),
  setFaceDetected: (detected, box = null, landmarks = null) => set({ 
    faceDetected: detected, 
    faceBoundingBox: box, 
    faceLandmarks: landmarks 
  }),
  setCurrentEffect: (effect) => set({ currentEffect: effect }),
  setCapturedImage: (image) => set({ capturedImage: image }),
}));
