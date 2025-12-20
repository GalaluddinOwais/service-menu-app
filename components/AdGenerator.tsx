'use client';
import { useRef } from 'react';

interface AdGeneratorProps {
  itemName: string;
  itemPrice: number;
  discountedPrice?: number;
  imageUrl: string;
  contactMessage: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
  onGenerate: () => void;
}

export default function AdGenerator({
  itemName,
  itemPrice,
  discountedPrice,
  imageUrl,
  contactMessage,
  themeColors,
  onGenerate,
}: AdGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateAd = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1080;
    const footerHeight = 180;
    const mainHeight = height - footerHeight;

    canvas.width = width;
    canvas.height = height;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      ctx.drawImage(img, 0, 0, width, mainHeight);

      // 1. الفاصل الأبيض السفلي
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, mainHeight, width, footerHeight);

      // 2. شارة الخصم وجملة العرض
      if (discountedPrice && discountedPrice < itemPrice) {
        const discountPercent = Math.round(((itemPrice - discountedPrice) / itemPrice) * 100);

        ctx.fillStyle = '#ef4444';
        const badgeW = 380;
        const badgeH = 110;
        const badgeX = 0; 
        const badgeY = 80;
        
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [0, 30, 30, 0]); 
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 70px "Baloo Bhaijaan 2", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`خصم %${discountPercent}`, badgeX + (badgeW / 2) + 10, badgeY + 80);
      }

      // 3. كتل السعر (تحريك لليسار وللأسفل أكثر)
      const contentAnchorY = mainHeight - 10;
      // إذا كان فيه خصم، الدائرة عند 220، لو مافيش خصم تروح شمال أكثر عند 150
      const mainStickerX = discountedPrice ? 220 : 150;
      // إذا لم يكن هناك خصم، نزل الدائرة للأسفل شوية
      const mainStickerY = discountedPrice ? contentAnchorY - 60 : contentAnchorY + 40;
      const mainRadius = 135;

      // السعر الملغي (خلفية)
      if (discountedPrice) {
        const oldRadius = 100;
        const oldX = mainStickerX - 90;
        const oldY = mainStickerY + 135; 

        ctx.beginPath();
        ctx.arc(oldX, oldY, oldRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(oldX, oldY, oldRadius - 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4b5563';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 65px "Baloo Bhaijaan 2", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(itemPrice).toString(), oldX, oldY + 22);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(oldX + 60, oldY + 15); 
        ctx.lineTo(oldX - 60, oldY - 15);
        ctx.stroke();
      }

      // السعر الحالي (مقدمة)
      ctx.beginPath();
      ctx.arc(mainStickerX, mainStickerY, mainRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mainStickerX, mainStickerY, mainRadius - 8, 0, Math.PI * 2);
      const stickerGrad = ctx.createLinearGradient(mainStickerX, mainStickerY - mainRadius, mainStickerX, mainStickerY + mainRadius);
      stickerGrad.addColorStop(0, themeColors.primary);
      stickerGrad.addColorStop(1, themeColors.secondary);
      ctx.fillStyle = stickerGrad;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const currentPrice = discountedPrice || itemPrice;

      ctx.font = 'bold 55px "Baloo Bhaijaan 2", Arial';
      ctx.fillText('جــــــ', mainStickerX, mainStickerY - 44);
      ctx.font = 'bold 85px "Baloo Bhaijaan 2", Arial';
      ctx.fillText(Math.floor(currentPrice).toString(), mainStickerX, mainStickerY + 25);

      // عرض "لفترة محدودة" فقط في حالة وجود خصم
      if (discountedPrice) {
        ctx.font = 'bold 33px "Baloo Bhaijaan 2", Arial';
        ctx.fillStyle = '#fff309ff';
        ctx.fillText('لفترة محدودة', mainStickerX, mainStickerY + 66);
        ctx.fillStyle = '#ffffff';
      }

      // 4. اسم الصنف (Outline وبدون خلفية)
      ctx.textAlign = 'right';
      ctx.font = 'bold 70px "Baloo Bhaijaan 2", Arial';

      const maxNameWidth = width / 1.66;
      const nameWords = itemName.split(' ');
      let nameLines = [];
      let currentNameLine = nameWords[0];

      for (let i = 1; i < nameWords.length; i++) {
        let testLine = currentNameLine + ' ' + nameWords[i];
        if (ctx.measureText(testLine).width > maxNameWidth) {
          nameLines.push(currentNameLine);
          currentNameLine = nameWords[i];
        } else {
          currentNameLine = testLine;
        }
      }
      nameLines.push(currentNameLine);

      const nameLineHeight = 70;
      const nameBaseLineY = 150;
      const nameX = width - 60;

      let currentNameY = nameBaseLineY;
      nameLines.forEach(line => {
          // رسم Outline للاسم لضمان الوضوح
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(line, nameX, currentNameY);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(line, nameX, currentNameY);
          currentNameY += nameLineHeight;
      });

      // 5. رسالة التواصل
      ctx.fillStyle = themeColors.primary;
      ctx.textAlign = 'right';
      ctx.font = 'bold 44px "Baloo Bhaijaan 2", Arial';

      // إزالة البروتوكول والدومين من روابط واتساب وترك الرقم فقط
      const cleanedMessage = contactMessage.replace(/(https?:\/\/)?wa\.me\//g, '');

      const maxContactWidth = (width * 2) / 3;
      const contactLineHeight = 60;
      const contactWords = cleanedMessage.split(' ');
      let contactLine = '';
      let contactY = mainHeight + 50;
      const startContactX = width - 50;

      for (let n = 0; n < contactWords.length; n++) {
        let testLine = contactLine + contactWords[n] + ' ';
        if (ctx.measureText(testLine).width > maxContactWidth && n > 0) {
          ctx.fillText(contactLine, startContactX, contactY);
          contactLine = contactWords[n] + ' ';
          contactY += contactLineHeight;
        } else {
          contactLine = testLine;
        }
      }
      ctx.fillText(contactLine, startContactX, contactY);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `Ad-${itemName}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          onGenerate();
        }
      }, 'image/png');

    } catch (error) {
      console.error(error);
      alert('فشل إنشاء الإعلان');
    }
  };

  return (
    <>
      <button
        onClick={generateAd}
        className="hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition"
     style={{ backgroundColor: '#00a254ff', width:100 }}>
        تحميل إعلان!
      </button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}