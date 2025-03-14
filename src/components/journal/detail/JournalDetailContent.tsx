import { formatDate } from '../../../utils/date';
import type { JournalEntry } from '../../../types/journal';
import { useState } from 'react';
import ImageGrid from '../../shared/ImageGrid';
import CollectDetailSheet from '../../collection/CollectDetailSheet';
import ImageGallery from '../../shared/ImageGallery';

interface JournalDetailContentProps {
  entry: JournalEntry;
}

export default function JournalDetailContent({ entry }: JournalDetailContentProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [selectedCollect, setSelectedCollect] = useState<any>(null);

  // 檢查是否為影片
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|m4v|mkv|3gp|wmv|flv|avi)$/i);
  };

  // 組合所有附件項目
  const attachmentItems = [
    // 媒體檔案
    ...(entry.media_urls || []).map(url => ({
      type: isVideo(url) ? 'video' : 'image',
      url,
      content: url,
      isFromCollect: entry.collect_id !== null
    })),
    // 連結預覽
    ...(entry.text_collects?.filter(c => c.type === 'link').map(c => ({
      type: 'link' as const,
      url: c.preview_image,
      content: c.content,
      title: c.title,
      isFromCollect: true,
      collect: c
    })) || []),
    // 文字收藏
    ...(entry.text_collects?.filter(c => c.type === 'text').map(c => ({
      type: 'text' as const,
      content: c.content,
      color: c.color,
      isFromCollect: true,
      collect: c
    })) || [])
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
    <article className="p-4 space-y-4">
      {/* Media Grid */}
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
      
      {/* Content */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{entry.title}</h1>
        <time className="block text-sm text-gray-500">
          {formatDate(new Date(entry.created_at), 'PPP')}
        </time>
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {entry.content}
        </p>
      </div>

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
    </article>
  );
}