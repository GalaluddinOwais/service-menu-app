'use client';
import { useState, useRef, useEffect, useId, forwardRef, useImperativeHandle } from 'react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  label: string;
  helperText?: string;
  onUploadStateChange?: (isUploading: boolean) => void;
  /** عند true: الصورة لا تُرفع إلا عند استدعاء uploadPendingFile من الأب (مثلاً عند الضغط على إضافة) */
  deferUpload?: boolean;
}

export interface ImageUploaderRef {
  getPendingFile: () => File | null;
  clearPendingFile: () => void;
}

const ImageUploader = forwardRef<ImageUploaderRef, ImageUploaderProps>(function ImageUploader({
  currentImageUrl,
  onImageUploaded,
  label,
  helperText,
  onUploadStateChange,
  deferUpload = false,
}, ref) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [error, setError] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useImperativeHandle(ref, () => ({
    getPendingFile: () => pendingFile,
    clearPendingFile: () => {
      setPendingFile(null);
      setPreviewUrl(undefined);
      onImageUploaded('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  }), [pendingFile, onImageUploaded]);

  // Update preview when currentImageUrl changes (e.g., when editing an item)
  useEffect(() => {
    if (!deferUpload || !pendingFile) {
      setPreviewUrl(currentImageUrl);
    }
    if (!pendingFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentImageUrl, deferUpload, pendingFile]);

  // دالة لضغط وتصغير الصورة
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // تحديد الحد الأقصى للأبعاد
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          // حساب الأبعاد الجديدة مع الحفاظ على النسبة
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          // إنشاء canvas لتصغير الصورة
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // تحويل إلى WebP بجودة مضغوطة
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('فشل ضغط الصورة'));
              }
            },
            'image/webp',
            0.85 // جودة 85%
          );
        };
        img.onerror = () => reject(new Error('فشل تحميل الصورة'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setError('الرجاء اختيار ملف صورة');
      return;
    }

    // التحقق من حجم الملف (10MB قبل الضغط)
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى 10MB');
      return;
    }

    setError('');
    setIsUploading(true);
    onUploadStateChange?.(true);

    try {
      // ضغط الصورة
      const compressedFile = await compressImage(file);

      // إنشاء معاينة محلية
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      if (deferUpload) {
        // تأجيل الرفع: تخزين الملف فقط، الرفع عند الإرسال (إضافة/تحديث)
        setPendingFile(compressedFile);
        onImageUploaded('');
      } else {
        // رفع فوري
        const formData = new FormData();
        formData.append('file', compressedFile);

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
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة');
      setPreviewUrl(currentImageUrl);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handleRemoveImage = () => {
    setPendingFile(null);
    setPreviewUrl(undefined);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700">
        {label}
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id={inputId}
      />

      {/* Image Preview Box OR Upload Box */}
      {previewUrl ? (
        <div className="inline-block relative">
          <img
            src={previewUrl}
            alt="معاينة"
            className="w-32 h-32 rounded-lg border-2 border-gray-200 object-cover"
          />
          {!isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <label
                htmlFor={inputId}
                className="text-white text-lg font-bold cursor-pointer transition-opacity hover:opacity-60"
                style={{ textShadow: '0 0px 2px rgba(0,0,0)' }}
              >
                تغييـــر
              </label>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-white text-lg font-bold transition-opacity hover:opacity-60"
                style={{ textShadow: '0 0px 2px rgba(0,0,0)' }}
              >
                إزالـــة
              </button>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 ${
            isUploading
              ? 'bg-gray-100 cursor-not-allowed'
              : 'hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium text-gray-500 mt-1">
            {isUploading ? 'جارِ الرفع...' : 'اختر صورة'}
          </span>
        </label>
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
    </div>
  );
});

export default ImageUploader;
