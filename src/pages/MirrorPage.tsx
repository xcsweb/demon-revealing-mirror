import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, Camera as CameraIcon, ArrowLeft } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useMirrorStore } from '@/store/useMirrorStore';
import { drawEffect } from '@/utils/effects';
import { EffectType } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 特效选择器组件
const EFFECTS: { id: EffectType; name: string; icon: string }[] = [
  { id: 'full-demon', name: '完全体', icon: '👹' },
  { id: 'demon-eyes', name: '妖瞳', icon: '👁️' },
  { id: 'fangs', name: '獠牙', icon: '🦷' },
  { id: 'horns', name: '魔角', icon: '👿' },
  { id: 'ghost', name: '幽魂', icon: '👻' },
];

export function MirrorPage() {
  const navigate = useNavigate();
  const {
    facingMode,
    toggleFacingMode,
    currentEffect,
    setCurrentEffect,
    setFaceDetected,
    setCapturedImage,
    faceBoundingBox,
    faceLandmarks
  } = useMirrorStore();

  const { videoRef, error } = useCamera(facingMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理人脸检测结果
  const handleFaceDetected = useCallback((box: any, landmarks: any) => {
    setFaceDetected(true, {
      x: box.xCenter - box.width / 2,
      y: box.yCenter - box.height / 2,
      width: box.width,
      height: box.height
    }, landmarks);
  }, [setFaceDetected]);

  const handleFaceLost = useCallback(() => {
    setFaceDetected(false);
  }, [setFaceDetected]);

  // 初始化人脸检测
  const { isReady: detectionReady, error: detectionError } = useFaceDetection(
    videoReady ? videoRef.current : null,
    { onFaceDetected: handleFaceDetected, onFaceLost: handleFaceLost }
  );

  // 绘制特效
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const animate = () => {
      if (video.readyState >= 2) {
        // 同步尺寸
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        drawEffect(
          ctx,
          currentEffect,
          { xCenter: faceBoundingBox?.x + (faceBoundingBox?.width / 2) || 0.5, yCenter: faceBoundingBox?.y + (faceBoundingBox?.height / 2) || 0.5, width: faceBoundingBox?.width || 0.2, height: faceBoundingBox?.height || 0.2 },
          faceLandmarks,
          canvas.width,
          canvas.height
        );
      }
      requestAnimationFrame(animate);
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [currentEffect, faceBoundingBox, faceLandmarks]);

  // 拍照功能
  const handleCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    // 创建临时画布组合视频和特效
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      // 绘制视频帧
      tempCtx.drawImage(videoRef.current, 0, 0);
      // 绘制特效
      tempCtx.drawImage(canvasRef.current, 0, 0);
      // 转换为图片
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
      {/* 闪光灯效果 */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 animate-pulse" />
      )}

      {/* 视频和画布区域 */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center bg-black"
      >
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

        {/* 特效 Canvas */}
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute object-cover w-full h-full pointer-events-none",
            facingMode === 'user' && "scale-x-[-1]"
          )}
        />

        {/* 加载状态 */}
        {!videoReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">加载摄像头中...</p>
          </div>
        )}
      </div>

      {/* 顶部导航 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={toggleFacingMode}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 z-30">
        <div className="flex flex-col items-center gap-6">
          {/* 特效选择器 */}
          <div className="flex gap-3 overflow-x-auto w-full pb-2 px-2">
            {EFFECTS.map((effect) => (
              <button
                key={effect.id}
                onClick={() => setCurrentEffect(effect.id)}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[80px] p-3 rounded-2xl transition-all duration-300",
                  currentEffect === effect.id
                    ? "bg-white/20 backdrop-blur-lg border border-white/30 scale-105"
                    : "bg-black/30 backdrop-blur-sm hover:bg-white/10"
                )}
              >
                <span className="text-3xl">{effect.icon}</span>
                <span className={cn(
                  "text-xs font-medium",
                  currentEffect === effect.id ? "text-yellow-300" : "text-white/70"
                )}>
                  {effect.name}
                </span>
              </button>
            ))}
          </div>

          {/* 拍照按钮 */}
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
