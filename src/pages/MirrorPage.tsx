import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Shuffle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useMirrorStore } from '@/store/useMirrorStore';
import { drawMonsterEffect } from '@/utils/effects';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 用于平滑人脸框过渡的类
class SmoothBoundingBox {
  private current: { x: number; y: number; width: number; height: number } | null = null;
  private target: { x: number; y: number; width: number; height: number } | null = null;
  private alpha = 0.15; // 更平滑的系数
  private lastNFrames: Array<{ x: number; y: number; width: number; height: number }> = [];
  private maxFrames = 5;

  update(target: { x: number; y: number; width: number; height: number } | null) {
    this.target = target;
    if (!this.current && target) {
      this.current = { ...target };
    }
    if (target) {
      this.lastNFrames.push({ ...target });
      if (this.lastNFrames.length > this.maxFrames) {
        this.lastNFrames.shift();
      }
    } else {
      this.lastNFrames = [];
    }
  }

  // 计算移动平均
  private getAverage() {
    if (this.lastNFrames.length === 0) return null;
    const sum = { x: 0, y: 0, width: 0, height: 0 };
    this.lastNFrames.forEach(box => {
      sum.x += box.x;
      sum.y += box.y;
      sum.width += box.width;
      sum.height += box.height;
    });
    const n = this.lastNFrames.length;
    return {
      x: sum.x / n,
      y: sum.y / n,
      width: sum.width / n,
      height: sum.height / n
    };
  }

  get() {
    if (!this.target) {
      this.current = null;
      return null;
    }

    if (!this.current) {
      this.current = { ...this.target };
      return this.current;
    }

    // 使用移动平均后的目标值
    const avgTarget = this.getAverage() || this.target;

    // 平滑过渡
    this.current.x += (avgTarget.x - this.current.x) * this.alpha;
    this.current.y += (avgTarget.y - this.current.y) * this.alpha;
    this.current.width += (avgTarget.width - this.current.width) * this.alpha;
    this.current.height += (avgTarget.height - this.current.height) * this.alpha;

    return this.current;
  }
}

export function MirrorPage() {
  const navigate = useNavigate();
  const {
    facingMode,
    toggleFacingMode,
    setFaceDetected,
    setCapturedImage,
    faceBoundingBox,
    currentMonster,
    resetMonster,
  } = useMirrorStore();

  const { videoRef, error } = useCamera(facingMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothBoxRef = useRef<SmoothBoundingBox>(new SmoothBoundingBox());
  const [videoReady, setVideoReady] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const lastBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleFaceDetected = useCallback((box: any, landmarks: any) => {
    if (!lastBoxRef.current) {
      resetMonster();
    }
    
    // MediaPipe 返回的是归一化坐标，直接传递
    setFaceDetected(true, {
      x: box.xCenter - box.width / 2,
      y: box.yCenter - box.height / 2,
      width: box.width,
      height: box.height
    }, landmarks);
    
    lastBoxRef.current = {
      x: box.xCenter - box.width / 2,
      y: box.yCenter - box.height / 2,
      width: box.width,
      height: box.height
    };
  }, [setFaceDetected, resetMonster]);

  const handleFaceLost = useCallback(() => {
    setFaceDetected(false);
    lastBoxRef.current = null;
  }, [setFaceDetected]);

  const { isReady: detectionReady, error: detectionError, isLoading: detectionLoading } = useFaceDetection(
    videoReady ? videoRef.current : null,
    { onFaceDetected: handleFaceDetected, onFaceLost: handleFaceLost }
  );

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const animate = () => {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // 更新平滑器
        smoothBoxRef.current.update(faceBoundingBox ? {
          x: faceBoundingBox.x,
          y: faceBoundingBox.y,
          width: faceBoundingBox.width,
          height: faceBoundingBox.height
        } : null);
        
        const smoothBox = smoothBoxRef.current.get();

        drawMonsterEffect(
          ctx,
          currentMonster,
          smoothBox ? {
            xCenter: smoothBox.x + (smoothBox.width / 2),
            yCenter: smoothBox.y + (smoothBox.height / 2),
            width: smoothBox.width,
            height: smoothBox.height
          } : null,
          canvas.width,
          canvas.height
        );
      }
      requestAnimationFrame(animate);
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [currentMonster, faceBoundingBox]);

  const handleCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.drawImage(videoRef.current, 0, 0);
      tempCtx.drawImage(canvasRef.current, 0, 0);
      const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      navigate('/result');
    }
  };

  const handleVideoLoaded = () => {
    setVideoReady(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">摄像头无法访问</h2>
        <p className="text-gray-400 mb-8">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden select-none">
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-pulse" />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          onLoadedMetadata={handleVideoLoaded}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute object-cover w-full h-full",
            facingMode === 'user' && "scale-x-[-1]"
          )}
        />

        <canvas
          ref={canvasRef}
          className={cn(
            "absolute object-cover w-full h-full pointer-events-none",
            facingMode === 'user' && "scale-x-[-1]"
          )}
        />

        {!videoReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">加载摄像头中...</p>
          </div>
        )}

        {detectionLoading && videoReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-yellow-300 text-lg">加载人脸检测中...</p>
          </div>
        )}

        {detectionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 z-30">
            <p className="text-red-300 text-lg mb-4">⚠️ {detectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {videoReady && !faceBoundingBox && !detectionLoading && !detectionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
            <p className="text-white text-lg bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">
              请将人脸对准摄像头
            </p>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          <button
            onClick={resetMonster}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
            title="换一个妖怪"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            onClick={toggleFacingMode}
            className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {faceBoundingBox && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 text-center">
          <div
            className="px-6 py-3 rounded-full backdrop-blur-md text-white font-bold shadow-lg"
            style={{ backgroundColor: `${currentMonster.color}50`, borderColor: currentMonster.color, borderWidth: 2 }}
          >
            <span className="text-2xl mr-2">{currentMonster.emoji}</span>
            {currentMonster.name}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 z-30">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
}