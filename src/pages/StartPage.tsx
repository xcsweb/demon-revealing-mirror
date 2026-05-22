import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/30">
            <Sparkles className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            照妖镜
          </h1>
        </div>

        {/* 副标题 */}
        <p className="text-purple-200 text-lg md:text-xl mb-12 text-center max-w-md leading-relaxed">
          体验神奇的人脸检测与特效叠加，探索神秘的视觉世界
        </p>

        {/* 开始按钮 */}
        <button
          onClick={() => navigate('/mirror')}
          className="group relative px-12 py-5 text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-2xl shadow-red-500/40 transition-all duration-300 hover:scale-105 hover:shadow-red-500/60 active:scale-95"
        >
          <span className="relative z-10">开始探索</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
        </button>

        {/* 底部提示 */}
        <p className="mt-16 text-gray-500 text-sm">
          请允许访问摄像头以获得最佳体验
        </p>
      </div>
    </div>
  );
}
