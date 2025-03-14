import { X, Share } from 'lucide-react';

interface UsageGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageGuideSheet({ isOpen, onClose }: UsageGuideSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">歡迎使用 Future Me</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-blue-800 leading-relaxed">
              你好，歡迎你使用 Future Me 的早期版本，我是開發者畢夫。如果你在使用的過程中遇到一些奇怪的情況或是 bug，歡迎隨時聯繫我，我會盡可能地協助你解決狀況。
            </p>
          </div>

          {/* Usage Guide */}
          <div>
            <h3 className="text-lg font-semibold mb-4">使用需知</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-medium">1</span>
                </div>
                <p className="text-gray-600">在收藏、寫日誌前，請先創建目標（點擊頁面頂部）。不同目標底下的收藏與日誌都是分開的，點擊頁面頂部的目標欄可以切換目標。</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-medium">2</span>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">隱藏瀏覽器網址列教學：</p>
                  <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1">
                    <li>
                      iOS：點一下選單列中的 
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded mx-1">
                        <Share className="w-3.5 h-3.5" />
                      </span>
                      向下捲動選項列表，然後點一下「加入主畫面」。
                    </li>
                    <li>Android：</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-medium">3</span>
                </div>
                <p className="text-gray-600">由於是早期版本，可能在更新的過程中資料會有所遺失，請記得將重要的資料備份好，也謝謝你的包容！</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600 text-sm">
              如果需要協助，歡迎聯繫：
              <a 
                href="mailto:shaohsuanpi@seekrtech.com"
                className="text-blue-500 hover:text-blue-600 underline ml-1"
              >
                shaohsuanpi@seekrtech.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600 transition-colors"
          >
            讓我們開始在下班後實現夢想吧！
          </button>
        </div>
      </div>
    </div>
  );
}