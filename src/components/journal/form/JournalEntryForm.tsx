import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import JournalToolbar from '../JournalToolbar';
import DatePicker from '../../shared/DatePicker';
import CollectionSelectorSheet from '../CollectionSelectorSheet';
import Toast from '../../shared/Toast';
import ImageGrid from '../../shared/ImageGrid';
import CollectDetailSheet from '../../collection/CollectDetailSheet';
import ImageGallery from '../../shared/ImageGallery';
import { MediaFile } from '../../../types/media';
import { JournalEntry } from '../../../types/journal';

interface JournalEntryFormProps {
  initialEntry?: JournalEntry;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    media_urls: string[];
    text_collects: Array<{
      type: 'text' | 'link';
      content: string;
      title?: string;
      preview_image?: string;
      color?: string;
    }>;
    created_at: string;
  }) => Promise<void>;
  error?: string;
}

export default function JournalEntryForm({
  initialEntry,
  onClose,
  onSave,
  error: propError
}: JournalEntryFormProps) {
  const [title, setTitle] = useState(initialEntry?.title ?? '');
  const [content, setContent] = useState(initialEntry?.content ?? '');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [textCollects, setTextCollects] = useState<Array<{
    type: 'text' | 'link';
    content: string;
    title?: string;
    preview_image?: string;
    color?: string;
  }>>(initialEntry?.text_collects || []);
  const [date, setDate] = useState(new Date(initialEntry?.created_at ?? Date.now()));
  const [isSaving, setIsSaving] = useState(false);
  const [isCollectionSelectorOpen, setIsCollectionSelectorOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'loading';
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | undefined>(propError);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCollect, setSelectedCollect] = useState<any>(null);

  useEffect(() => {
    setError(propError);
  }, [propError]);

  useEffect(() => {
    if (initialEntry?.media_urls) {
      setMediaFiles(initialEntry.media_urls.map(url => ({
        url,
        type: url.match(/\.(mp4|webm|ogg|mov|m4v|mkv|3gp|wmv|flv|avi)$/i) ? 'video' : 'image',
        file: new File([], 'existing')
      })));
    }
  }, [initialEntry]);

  const handleSave = async () => {
    if (!title && !content && mediaFiles.length === 0 && textCollects.length === 0) {
      setError('請至少填寫標題、內容或加入媒體');
      return;
    }

    try {
      setIsSaving(true);
      setError(undefined);
      await onSave({
        title,
        content,
        media_urls: mediaFiles.map(m => m.url),
        text_collects: textCollects,
        created_at: date.toISOString()
      });
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      setError(error instanceof Error ? error.message : '儲存失敗，請稍後再試');
      setIsSaving(false);
    }
  };

  const handleMediaAdd = async (newMedia: MediaFile | MediaFile[]) => {
    const mediaArray = Array.isArray(newMedia) ? newMedia : [newMedia];
    setMediaFiles(prev => [...prev, ...mediaArray]);
  };

  const handleMediaUpload = async (newMedia: MediaFile | MediaFile[], onProgress?: (progress: number, fileName: string) => void) => {
    try {
      setUploadStatus({ type: 'loading', message: '上傳中...' });
      setError(undefined);
      await handleMediaAdd(newMedia);
      setUploadStatus({ type: 'success', message: '上傳成功' });
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : '上傳失敗，請稍後再試';
      setUploadStatus({ type: 'error', message: errorMessage });
      setError(errorMessage);
    }
  };

  const handleMediaRemove = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setError(undefined);
  };

  const handleTextCollectRemove = (index: number) => {
    setTextCollects(prev => prev.filter((_, i) => i !== index));
  };

  const handleCollectSelect = ({ initialTextCollects, initialMediaUrls }: {
    initialTextCollects: Array<{
      type: 'text' | 'link';
      content: string;
      title?: string;
      preview_image?: string;
      color?: string;
    }>;
    initialMediaUrls: string[];
  }) => {
    setTextCollects(prev => [...prev, ...initialTextCollects]);

    const newMediaFiles = initialMediaUrls.map(url => ({
      url,
      type: url.match(/\.(mp4|webm|ogg|mov|m4v|mkv|3gp|wmv|flv|avi)$/i) ? 'video' : 'image',
      file: new File([], 'collect')
    } as MediaFile));
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  // 組合所有附件項目
  const attachmentItems = [
    // 媒體檔案
    ...mediaFiles.map(file => ({
      type: file.type,
      url: file.url,
      content: file.url,
      isFromCollect: false
    })),
    // 連結預覽
    ...textCollects.filter(c => c.type === 'link').map(c => ({
      type: 'link' as const,
      url: c.preview_image,
      content: c.content,
      title: c.title,
      isFromCollect: true,
      collect: c
    })),
    // 文字收藏
    ...textCollects.filter(c => c.type === 'text').map(c => ({
      type: 'text' as const,
      content: c.content,
      color: c.color,
      isFromCollect: true,
      collect: c
    }))
  ];

  // 取得所有圖片的 URL
  const imageUrls = attachmentItems
    .filter(item => item.type === 'image' || (item.type === 'link' && item.url))
    .map(item => item.url!)
    .filter(Boolean);

  // 處理圖片點擊
  const handleImageClick = (url: string) => {
    const index = imageUrls.indexOf(url);
    if (index !== -1) {
      setSelectedImageIndex(index);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900"
          aria-label="取消"
        >
          <X className="w-6 h-6" />
        </button>
        <DatePicker date={date} onChange={setDate} />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`text-blue-500 hover:text-blue-600 disabled:opacity-50 ${
            isSaving ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          aria-label="儲存"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {attachmentItems.length > 0 && (
            <ImageGrid
              items={attachmentItems}
              aspectRatio={2}
              gap={4}
              onVideoClick={(url) => setSelectedVideo(url === selectedVideo ? null : url)}
              onImageClick={handleImageClick}
              onCollectClick={(item) => setSelectedCollect(item.collect)}
              selectedVideo={selectedVideo}
            />
          )}
          
          <div className="p-4 space-y-4">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="標題"
              className="w-full text-xl font-semibold focus:outline-none resize-none min-h-[2.5rem] break-words whitespace-pre-wrap"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="開始寫作..."
              className="w-full flex-1 focus:outline-none resize-none break-words whitespace-pre-wrap"
              style={{ minHeight: 'calc(100vh - 400px)' }}
            />
          </div>
        </div>

        {/* Upload Status Toast */}
        {uploadStatus && (
          <Toast
            message={uploadStatus.message}
            type={uploadStatus.type}
            onClose={() => setUploadStatus(null)}
            duration={uploadStatus.type === 'error' ? 5000 : 3000}
          />
        )}

        {/* Toolbar */}
        <JournalToolbar
          onCollectionClick={() => setIsCollectionSelectorOpen(true)}
          onPhotoClick={(media) => handleMediaUpload(media)}
          onCameraClick={(media) => handleMediaUpload(media)}
          onLinkClick={url => handleMediaUpload({ url, type: 'image', file: new File([], 'link') })}
        />

        {/* Collection Selector */}
        <CollectionSelectorSheet
          isOpen={isCollectionSelectorOpen}
          onClose={() => setIsCollectionSelectorOpen(false)}
          onSelect={handleCollectSelect}
        />

        {/* Image Gallery */}
        <ImageGallery
          images={imageUrls}
          initialIndex={selectedImageIndex}
          isOpen={selectedImageIndex !== -1}
          onClose={() => setSelectedImageIndex(-1)}
        />

        {/* Collect Detail Sheet */}
        {selectedCollect && (
          <CollectDetailSheet
            collect={selectedCollect}
            isOpen={true}
            onClose={() => setSelectedCollect(null)}
            onUpdate={() => {
              setSelectedCollect(null);
            }}
          />
        )}
      </div>
    </div>
  );
}