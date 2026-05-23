import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, Share2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useMirrorStore } from '@/store/useMirrorStore';


type Phase = 'idle' | 'detecting' | 'blackout' | 'story' | 'card' | 'result';

export function MirrorPage() {
  const navigate = useNavigate();
  const {
    facingMode,
    toggleFacingMode,
    setFaceDetected,
    currentMonster,
    resetMonster
  } = useMirrorStore();

  const { videoRef, error } = useCamera(facingMode);
  const [videoReady, setVideoReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [storyIndex, setStoryIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFaceDetected = useCallback((box: any, landmarks: any) => {
    if (phase === 'idle') {
      setPhase('detecting');
      setTimeout(() => {
        setPhase('blackout');
        setTimeout(() => {
          if (!currentMonster) {
            resetMonster();
          }
          setPhase('story');
        }, 800);
      }, 1000);
    }
    setFaceDetected(true, {
      x: box.xCenter - box.width / 2,
      y: box.yCenter - box.height / 2,
      width: box.width,
      height: box.height
    }, landmarks);
  }, [phase, setFaceDetected, resetMonster, currentMonster]);

  const handleFaceLost = useCallback(() => {
    setFaceDetected(false);
  }, [setFaceDetected]);

  const { isReady: detectionReady, error: detectionError, isLoading: detectionLoading } = useFaceDetection(
    videoReady ? videoRef.current : null,
    { onFaceDetected: handleFaceDetected, onFaceLost: handleFaceLost }
  );

  useEffect(() => {
    if (phase === 'story' && currentMonster) {
      // 进入 story 阶段时重置图片状态
      setImageLoadError(false);
      
      if (storyIndex < currentMonster.story.length) {
        const timer = setTimeout(() => {
          setStoryIndex(prev => prev + 1);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setPhase('card');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, storyIndex, currentMonster]);

  const handleVideoLoaded = () => {
    setVideoReady(true);
  };

  const handleReset = () => {
    setPhase('idle');
    setStoryIndex(0);
    setImageLoadError(false);
    resetMonster();
  };

  const handleSave = async () => {
    if (!currentMonster) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/images/monsters/${currentMonster.id}.png`);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.download = `${currentMonster.name}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!currentMonster) return;
    
    const shareText = `测了照妖镜！原来我是${currentMonster.name}！${currentMonster.description}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '照妖镜结果',
          text: shareText,
        });
      } catch (error) {
        console.log('分享取消或失败');
      }
    } else {
      // 如果不支持分享，复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareText);
        alert('已复制到剪贴板！');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  const getMonsterImageUrl = () => {
    if (!currentMonster) return '';
    return `/images/monsters/${currentMonster.id}.png`;
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
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          onLoadedMetadata={handleVideoLoaded}
          autoPlay
          playsInline
          muted
          className={`absolute object-cover w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${(phase === 'blackout' || phase === 'story' || phase === 'card') ? 'opacity-0' : ''}`}
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
      </div>

      {phase === 'blackout' && (
        <div className="absolute inset-0 bg-black z-40 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">🔮</div>
            <p className="text-purple-300 text-xl animate-pulse">照妖镜中...</p>
          </div>
        </div>
      )}

      {phase === 'story' && currentMonster && (
        <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center p-6">
          {currentMonster.story.slice(0, storyIndex).map((text, index) => (
            <p
              key={index}
              className={`text-2xl font-bold text-center mb-4 transition-all duration-500 ${index === storyIndex - 1 ? 'text-white animate-fadeIn' : 'text-gray-500 scale-95'}`}
              style={{ color: index === storyIndex - 1 ? currentMonster.color : undefined }}
            >
              {text}
            </p>
          ))}
        </div>
      )}

      {phase === 'card' && currentMonster && (
        <div className="absolute inset-0 bg-black/95 z-40 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div
              className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-2 animate-fadeIn"
              style={{ borderColor: currentMonster.color }}
            >
              <div className="aspect-[3/4] bg-gray-800 relative overflow-hidden">
                <img
                  src={getMonsterImageUrl()}
                  alt={currentMonster.name}
                  className="w-full h-full object-cover"
                  onError={() => {
                    setImageLoadError(true);
                  }}
                />
                {imageLoadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <span className="text-8xl opacity-80">{currentMonster.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-4xl">{currentMonster.emoji}</span>
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: currentMonster.color }}
                  >
                    {currentMonster.name}
                  </h2>
                </div>
                <p className="text-gray-300 text-center mb-6">
                  {currentMonster.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white rounded-2xl font-bold transition-colors"
              >
                <Download className="w-5 h-5" />
                {isSaving ? '保存中...' : '保存'}
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl font-bold transition-colors"
              >
                <Share2 className="w-5 h-5" />
                分享
              </button>
            </div>

            <button
              onClick={handleReset}
              className="mt-3 w-full py-4 text-white bg-gray-800 rounded-2xl font-bold hover:bg-gray-700 transition-colors"
            >
              🔄 再测一次
            </button>
          </div>
        </div>
      )}

      {phase === 'idle' && (
        <>
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

          {videoReady && !detectionLoading && !detectionError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <p className="text-white text-lg bg-black/40 px-6 py-3 rounded-full backdrop-blur-md animate-pulse">
                照妖镜已就绪，请对准人脸
              </p>
            </div>
          )}
        </>
      )}

      {phase === 'detecting' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-center">
            <div className="w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-purple-300 text-xl">正在检测中...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
