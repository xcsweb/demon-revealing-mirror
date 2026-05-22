import { useNavigate } from 'react-router-dom';
import { useMirrorStore } from '@/store/useMirrorStore';
import { Download, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';

export function ResultPage() {
  const navigate = useNavigate();
  const { capturedImage, setCapturedImage } = useMirrorStore();

  const handleDownload = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.download = `demon-mirror-${Date.now()}.jpg`;
    link.href = capturedImage;
    link.click();
  };

  if (!capturedImage) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <p className="text-white">没有照片</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 顶部导航 */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 text-yellow-400">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">照妖镜</span>
        </div>
        
        <div className="w-12" /> {/* 占位 */}
      </div>

      {/* 图片区域 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-[500px] w-full shadow-2xl rounded-2xl overflow-hidden">
          <img
            src={capturedImage}
            alt="照妖镜照片"
            className="w-full h-auto"
          />
          
          {/* 装饰性边框 */}
          <div className="absolute inset-0 pointer-events-none border-2 border-yellow-500/20 rounded-2xl" />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="p-6 bg-gray-900/50 backdrop-blur-xl border-t border-gray-800">
        <div className="flex gap-4 max-w-[500px] mx-auto">
          <button
            onClick={() => {
              setCapturedImage(null);
              navigate('/mirror');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            重新拍摄
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 rounded-2xl font-bold shadow-lg shadow-yellow-500/30 transition-all"
          >
            <Download className="w-5 h-5" />
            保存照片
          </button>
        </div>
      </div>
    </div>
  );
}
