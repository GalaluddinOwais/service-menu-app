'use client';
import { useState, useRef, useEffect } from 'react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  label: string;
  helperText?: string;
}

export default function ImageUploader({
  currentImageUrl,
  onImageUploaded,
  label,
  helperText,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [error, setError] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes (e.g., when editing an item)
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setError('الرجاء اختيار ملف صورة');
      return;
    }

    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى 5MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // إنشاء معاينة محلية
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // رفع الملف
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل رفع الصورة');
      }

      const data = await response.json();
      setPreviewUrl(data.url);
      onImageUploaded(data.url);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة');
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('الرجاء إدخال رابط الصورة');
      return;
    }

    // التحقق من صحة الرابط
    try {
      new URL(urlInput);
      setPreviewUrl(urlInput);
      onImageUploaded(urlInput);
      setError('');
    } catch {
      setError('رابط غير صحيح');
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(undefined);
    onImageUploaded('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        {/* Checkbox to toggle URL mode */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={uploadMode === 'url'}
            onChange={(e) => setUploadMode(e.target.checked ? 'url' : 'file')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">استخدام رابط خارجي</span>
        </label>
      </div>

      {uploadMode === 'url' ? (
        /* URL Input Mode */
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            تطبيق
          </button>
        </div>
      ) : (
        /* File Upload Mode */
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>
      )}

      {/* Helper Text */}
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {/* Loading State */}
      {isUploading && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">جارِ رفع الصورة...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="معاينة"
            className="w-32 h-32 rounded-lg border-2 border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition"
            title="إزالة الصورة"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
