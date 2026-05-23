import { create } from 'zustand';
import { FaceBoundingBox, Monster } from '@/types';
import { MONSTERS, getRandomMonster } from '@/utils/monsters';

interface MirrorState {
  facingMode: 'user' | 'environment';
  faceDetected: boolean;
  faceBoundingBox: FaceBoundingBox | null;
  faceLandmarks: any | null;
  currentMonster: Monster;
  capturedImage: string | null;
  toggleFacingMode: () => void;
  setFaceDetected: (detected: boolean, box?: FaceBoundingBox | null, landmarks?: any) => void;
  setCurrentMonster: (monster: Monster) => void;
  setCapturedImage: (image: string | null) => void;
  resetMonster: () => void;
}

export const useMirrorStore = create<MirrorState>((set) => ({
  facingMode: 'user',
  faceDetected: false,
  faceBoundingBox: null,
  faceLandmarks: null,
  currentMonster: getRandomMonster(),
  capturedImage: null,
  
  toggleFacingMode: () => set((state) => ({ 
    facingMode: state.facingMode === 'user' ? 'environment' : 'user' 
  })),
  setFaceDetected: (detected, box = null, landmarks = null) => set({ 
    faceDetected: detected, 
    faceBoundingBox: box, 
    faceLandmarks: landmarks 
  }),
  setCurrentMonster: (monster) => set({ currentMonster: monster }),
  setCapturedImage: (image) => set({ capturedImage: image }),
  resetMonster: () => set({ currentMonster: getRandomMonster() }),
}));