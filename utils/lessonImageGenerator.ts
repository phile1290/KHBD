/**
 * Hệ thống Tạo & Xuất bản Hình ảnh Trực quan Học cụ / Mô hình Kỹ thuật / Đối tượng Bài học
 * - Trực tiếp tạo và hiển thị hình ảnh mô phỏng chính xác đối tượng, học cụ hoặc mô hình kỹ thuật
 *   được nhắc đến ở câu văn ngay phía trên (`precedingContext`) và dòng mô tả (`rawLine`).
 * - TUYỆT ĐỐI KHÔNG vẽ khung giao diện phiếu học tập ("Thành phần quan sát 1/2", "Nội dung hoạt động..."),
 *   KHÔNG vẽ cảnh lớp học chung chung, KHÔNG vẽ nhầm sang giao diện PowerPoint khi câu lệnh có từ "Giáo viên trình chiếu...".
 */

import { GoogleGenAI } from "@google/genai";
import { LessonPlanResponse } from "../types";

// Tách riêng bộ nhớ đệm ảnh AI thực tế và ảnh vẽ Canvas dự phòng để ảnh AI luôn được ưu tiên tuyệt đối
const aiGeneratedImageCache = new Map<string, string>();
const canvasFallbackCache = new Map<string, string>();
let preferredImageModel: string | null = null;

type ImageUpdateListener = () => void;
const imageUpdateListeners = new Set<ImageUpdateListener>();

export const subscribeToImageUpdates = (listener: ImageUpdateListener): (() => void) => {
    imageUpdateListeners.add(listener);
    return () => {
        imageUpdateListeners.delete(listener);
    };
};

const notifyImageListeners = () => {
    imageUpdateListeners.forEach(fn => {
        try {
            fn();
        } catch {}
    });
};

export const isImageHintLine = (line: string): boolean => {
    const trimmed = (line || '').trim();
    return /^[-–\*\s]*(\[|\()?(Gợi ý hình ảnh|Hình ảnh minh họa|Hình minh họa|Hình ảnh)/i.test(trimmed);
};

export const extractCleanImageDescription = (rawLine: string): string => {
    let text = (rawLine || '').trim();
    text = text.replace(/^[-–\*\s]+/, '');
    text = text.replace(/^(\[|\()?(Gợi ý hình ảnh|Hình ảnh minh họa|Hình minh họa|Hình ảnh)\s*[:\-–]?\s*/i, '');
    text = text.replace(/[\]\)]+$/, '');
    return text.trim() || 'Mô hình trực quan đối tượng bài học';
};

/**
 * Loại bỏ các cụm động từ sư phạm của Giáo viên ("Giáo viên trình chiếu hình ảnh...", "GV yêu cầu các nhóm mở...")
 * để trích xuất ĐÚNG ĐỐI TƯỢNG / HỌC CỤ / MÔ HÌNH KỸ THUẬT cần vẽ.
 */
export const extractCoreVisualObjectText = (rawText: string): string => {
    let text = (rawText || '').trim();
    text = text.replace(/^[-–\*\s]+/, '');
    text = text.replace(
        /^(giáo\s*viên|gv)\s+(trình\s*chiếu|chiếu|treo|giới\s*thiệu|đưa\s*ra|cho\s*học\s*sinh\s*xem|cho\s*hs\s*quan\s*sát|yêu\s*cầu\s*(các\s*nhóm|học\s*sinh|hs)\s*(quan\s*sát|mở|xem|tìm\s*hiểu|thảo\s*luận)?|hướng\s*dẫn\s*(học\s*sinh|hs)\s*(quan\s*sát|mở)?)\s*(hình\s*ảnh|tranh\s*ảnh|tranh|mô\s*hình|sơ\s*đồ|bảng|video|slide)?\s*/i,
        ''
    );
    text = text.replace(/^(hình\s*ảnh\s*minh\s*họa|hình\s*minh\s*họa|hình\s*ảnh|minh\s*họa)\s*(về|của|cho)?\s*/i, '');
    return text.trim();
};

export const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
    const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const binaryString = atob(base64Part);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number = 3
): string[] => {
    const words = (text || '').split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const testLine = current ? `${current} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && current) {
            lines.push(current);
            current = word;
            if (lines.length >= maxLines - 1) {
                break;
            }
        } else {
            current = testLine;
        }
    }

    const usedWordsCount = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const remainingWords = words.slice(usedWordsCount).join(' ');
    if (remainingWords) {
        let lastLine = remainingWords;
        while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 8) {
            lastLine = lastLine.slice(0, -1).trim();
        }
        lines.push(lastLine === remainingWords ? lastLine : `${lastLine}...`);
    } else if (current) {
        lines.push(current);
    }

    return lines.slice(0, maxLines);
};

const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string | CanvasGradient,
    stroke?: string,
    lineWidth: number = 2
) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
};

/**
 * Vẽ đường chỉ dẫn kỹ thuật (Callout Leader Line) từ điểm trên vật thể (ox, oy) tới nhãn (lx, ly)
 */
const drawTechnicalCallout = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    lx: number,
    ly: number,
    title: string,
    subtitle: string = '',
    align: 'left' | 'right' = 'left',
    accentColor: string = '#0284C7'
) => {
    ctx.save();
    const boxW = subtitle ? 210 : 190;
    const boxH = subtitle ? 42 : 28;
    const boxX = align === 'left' ? lx : lx - boxW;
    const boxY = ly - boxH / 2;

    // Đường gấp khúc kỹ thuật
    const elbowX = align === 'left' ? lx - 14 : lx + 14;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(elbowX, ly);
    ctx.lineTo(lx, ly);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Điểm chấm tròn trên vật thể
    ctx.beginPath();
    ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    // Hộp nhãn kỹ thuật
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 6, 'rgba(255, 255, 255, 0.96)', accentColor, 1.5);
    // Thanh màu nhấn bên cạnh
    drawRoundedRect(
        ctx,
        align === 'left' ? boxX : boxX + boxW - 5,
        boxY,
        5,
        boxH,
        3,
        accentColor
    );

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textStartX = boxX + 11;
    if (subtitle) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12px "Times New Roman", Arial, sans-serif';
        ctx.fillText(title, textStartX, boxY + 14);
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 11px "Times New Roman", Arial, sans-serif';
        ctx.fillText(subtitle, textStartX, boxY + 30);
    } else {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12.5px "Times New Roman", Arial, sans-serif';
        ctx.fillText(title, textStartX, boxY + boxH / 2);
    }
    ctx.restore();
};

const drawBadgeLabel = (
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    bgColor: string = '#EFF6FF',
    borderColor: string = '#3B82F6',
    textColor: string = '#1E3A8A'
) => {
    ctx.font = 'bold 12px "Times New Roman", Arial, sans-serif';
    const w = Math.max(72, ctx.measureText(text).width + 18);
    const h = 23;
    drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 6, bgColor, borderColor, 1.5);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
};

const drawNumberedCalloutCircle = (
    ctx: CanvasRenderingContext2D,
    num: number | string,
    cx: number,
    cy: number,
    radius: number = 15
) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#991B1B';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(radius * 1.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), cx, cy + 1);
    ctx.restore();
};

/**
 * /**
 * 1. HÌNH ẢNH TRỰC QUAN RÔ-BỐT VÀ CÁC BỘ PHẬN CẤU TẠO ĐẶT TRÊN BÀN KỸ THUẬT
 * (Hoàn toàn trực quan 3D: Rô-bốt ở trung tâm cùng các linh kiện thực tế đặt cạnh trên mặt bàn — tuyệt đối không vẽ nhánh mindmap hay hộp chữ infographic)
 */
const drawRobotAnatomyScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#EFF6FF');
    bgGrad.addColorStop(0.7, '#DBEAFE');
    bgGrad.addColorStop(1, '#BFDBFE');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#3B82F6', 2);

    // Mặt bàn gỗ thực hành
    const tableGrad = ctx.createLinearGradient(0, 310, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(0.5, '#B45309');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 312, 736, 94, 8, tableGrad, '#78350F', 1.5);

    const cx = 380;

    // Bóng đổ và bệ đứng 3D của Rô-bốt
    ctx.beginPath();
    ctx.ellipse(cx, 366, 118, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fill();

    // --- 1. ĐẦU RÔ-BỐT & CAMERA CẢM BIẾN ---
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 28, 48);
    ctx.lineTo(cx - 34, 26);
    ctx.moveTo(cx + 28, 48);
    ctx.lineTo(cx + 34, 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 34, 24, 5, 0, Math.PI * 2);
    ctx.arc(cx + 34, 24, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0EA5E9';
    ctx.fill();

    const headGrad = ctx.createLinearGradient(cx - 48, 44, cx + 48, 108);
    headGrad.addColorStop(0, '#FFFFFF');
    headGrad.addColorStop(0.6, '#E2E8F0');
    headGrad.addColorStop(1, '#94A3B8');
    drawRoundedRect(ctx, cx - 48, 44, 96, 64, 16, headGrad, '#334155', 2.2);

    drawRoundedRect(ctx, cx - 38, 56, 76, 34, 10, '#0F172A', '#0284C7', 1.8);
    [-17, 17].forEach(offsetX => {
        ctx.beginPath();
        ctx.arc(cx + offsetX, 73, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0284C7';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + offsetX, 73, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + offsetX - 2, 71, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
    });

    drawRoundedRect(ctx, cx - 18, 95, 36, 6, 3, '#38BDF8');
    drawRoundedRect(ctx, cx - 16, 108, 32, 14, 4, '#64748B', '#334155', 1.8);

    // --- 2. THÂN RÔ-BỐT (HIỂN THỊ TRỰC QUAN BẢNG MẠCH ĐIỀU KHIỂN & PIN NĂNG LƯỢNG) ---
    const torsoGrad = ctx.createLinearGradient(cx - 66, 122, cx + 66, 246);
    torsoGrad.addColorStop(0, '#F8FAFC');
    torsoGrad.addColorStop(0.6, '#CBD5E1');
    torsoGrad.addColorStop(1, '#94A3B8');
    drawRoundedRect(ctx, cx - 66, 122, 132, 124, 18, torsoGrad, '#334155', 2.4);

    // Khoang ngực: Vi mạch điều khiển
    drawRoundedRect(ctx, cx - 46, 134, 92, 50, 8, '#0F172A', '#0EA5E9', 2);
    drawRoundedRect(ctx, cx - 18, 145, 36, 28, 4, '#0284C7', '#38BDF8', 1.5);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    [-34, -26, 26, 34].forEach(px => {
        ctx.beginPath();
        ctx.moveTo(cx + px, 142);
        ctx.lineTo(cx + px, 176);
        ctx.stroke();
    });

    // Khoang bụng: Khối pin năng lượng xanh lá
    drawRoundedRect(ctx, cx - 44, 192, 88, 38, 6, '#1E293B', '#F59E0B', 1.8);
    [-26, -8, 10, 28].forEach(bx => {
        drawRoundedRect(ctx, cx + bx - 6, 199, 12, 24, 3, '#22C55E', '#86EFAC', 1);
    });

    // --- 3. CÁNH TAY CƠ KHÍ & TAY KẸP ---
    [-78, 62].forEach(sx => {
        drawRoundedRect(ctx, cx + sx, 128, 16, 28, 6, '#0284C7', '#1E3A8A', 1.8);
    });

    // Tay trái & tay phải
    [-1, 1].forEach(dir => {
        const armX = dir === -1 ? cx - 104 : cx + 78;
        const jointX = dir === -1 ? cx - 91 : cx + 91;
        drawRoundedRect(ctx, armX, 134, 26, 56, 10, '#E2E8F0', '#334155', 2);
        ctx.beginPath();
        ctx.arc(jointX, 196, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        drawRoundedRect(ctx, armX + 1, 206, 24, 46, 8, '#CBD5E1', '#334155', 2);

        // Kẹp cơ khí
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(jointX - 6, 252);
        ctx.lineTo(jointX - 16, 270);
        ctx.lineTo(jointX - 7, 280);
        ctx.moveTo(jointX + 6, 252);
        ctx.lineTo(jointX + 16, 270);
        ctx.lineTo(jointX + 7, 280);
        ctx.stroke();
    });

    // --- 4. CHÂN & BÁNH XE DI CHUYỂN ---
    drawRoundedRect(ctx, cx - 48, 246, 96, 18, 6, '#475569', '#1E293B', 2);
    [-32, 32].forEach(lx => {
        drawRoundedRect(ctx, cx + lx - 16, 264, 32, 66, 8, '#E2E8F0', '#334155', 2);
        drawRoundedRect(ctx, cx + lx - 10, 280, 20, 32, 4, '#0284C7', '#1E3A8A', 1.4);
        drawRoundedRect(ctx, cx + lx - 22, 330, 44, 24, 8, '#334155', '#0F172A', 2);
        ctx.beginPath();
        ctx.arc(cx + lx - 14, 352, 9, 0, Math.PI * 2);
        ctx.arc(cx + lx + 14, 352, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // --- 5. CÁC LINH KIỆN RỜI ĐẶT TRỰC QUAN TRÊN MẶT BÀN BÊN TRÁI & BÊN PHẢI ---
    // Bên trái: Cụm cảm biến siêu âm & động cơ bánh răng đặt trên mặt bàn
    drawRoundedRect(ctx, 64, 248, 148, 92, 12, '#FFFFFF', '#0284C7', 2);
    drawRoundedRect(ctx, 84, 266, 108, 42, 8, '#0EA5E9', '#0369A1', 1.8);
    ctx.beginPath();
    ctx.arc(114, 287, 13, 0, Math.PI * 2);
    ctx.arc(162, 287, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#E0F2FE';
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bên phải: Bảng mạch điều khiển & khối Pin rời đặt trên mặt bàn
    drawRoundedRect(ctx, 548, 248, 148, 92, 12, '#FFFFFF', '#16A34A', 2);
    drawRoundedRect(ctx, 566, 264, 62, 54, 6, '#15803D', '#14532D', 1.8);
    drawRoundedRect(ctx, 580, 276, 34, 30, 4, '#0F172A', '#4ADE80', 1.2);
    drawRoundedRect(ctx, 638, 268, 42, 48, 6, '#F59E0B', '#B45309', 1.8);
    drawRoundedRect(ctx, 648, 262, 22, 6, 2, '#94A3B8');
};

/**
 * 2. HÌNH ẢNH CẬN CẢNH BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT TIỂU HỌC ĐẶT TRÊN BÀN GỖ
 * (Hoàn toàn trực quan: Hộp nhựa chia ngăn đựng chi tiết lắp ghép + Tua-vít + Cờ-lê đặt trên mặt bàn gỗ)
 */
const drawTechnicalAssemblyKitScene = (ctx: CanvasRenderingContext2D) => {
    const woodGrad = ctx.createLinearGradient(0, 0, 760, 420);
    woodGrad.addColorStop(0, '#E7CBA9');
    woodGrad.addColorStop(0.5, '#DEB887');
    woodGrad.addColorStop(1, '#CFA36E');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, woodGrad, '#8B5A2B', 2);

    ctx.strokeStyle = 'rgba(120, 63, 4, 0.12)';
    ctx.lineWidth = 1.5;
    for (let y = 28; y < 405; y += 34) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.bezierCurveTo(240, y - 8, 520, y + 8, 750, y - 3);
        ctx.stroke();
    }

    // Bóng đổ & Vỏ hộp nhựa chia ngăn đựng bộ lắp ghép
    drawRoundedRect(ctx, 36, 36, 516, 356, 14, 'rgba(15, 23, 42, 0.22)');
    drawRoundedRect(ctx, 28, 28, 512, 352, 12, '#F8FAFC', '#0284C7', 3);
    drawRoundedRect(ctx, 40, 40, 488, 328, 8, '#E2E8F0', '#64748B', 2);

    // NGĂN 1: Các thanh thẳng, thanh chữ U, thanh chữ L có lỗ
    drawRoundedRect(ctx, 48, 48, 234, 154, 6, '#FFFFFF', '#94A3B8', 1.5);
    const beamColors = [
        { y: 64, w: 204, col: '#2563EB', holes: 9 },
        { y: 94, w: 180, col: '#16A34A', holes: 8 },
        { y: 124, w: 204, col: '#DC2626', holes: 9 },
        { y: 154, w: 156, col: '#F59E0B', holes: 7 }
    ];
    beamColors.forEach(b => {
        drawRoundedRect(ctx, 60, b.y, b.w, 20, 5, b.col, '#1E293B', 1.2);
        for (let i = 0; i < b.holes; i++) {
            ctx.beginPath();
            ctx.arc(74 + i * 22, b.y + 10, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#F8FAFC';
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });

    // NGĂN 2: Bánh răng, bánh xe, ròng rọc
    drawRoundedRect(ctx, 290, 48, 230, 154, 6, '#FFFFFF', '#94A3B8', 1.5);
    const drawGear = (gx: number, gy: number, r: number, color: string) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < 12; a++) {
            const ang = (a * Math.PI) / 6;
            ctx.beginPath();
            ctx.arc(gx + Math.cos(ang) * r, gy + Math.sin(ang) * r, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(gx, gy, r - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(gx, gy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };
    drawGear(338, 100, 26, '#EF4444');
    drawGear(402, 94, 20, '#F59E0B');
    drawGear(374, 148, 19, '#3B82F6');

    [
        { x: 468, y: 92, r: 26 },
        { x: 472, y: 152, r: 22 }
    ].forEach(w => {
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r * 0.58, 0, Math.PI * 2);
        ctx.fillStyle = '#FACC15';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
    });

    // NGĂN 3: Ốc vít, đai ốc, vòng đệm, trục thép
    drawRoundedRect(ctx, 48, 210, 234, 150, 6, '#FFFFFF', '#94A3B8', 1.5);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
            const sx = 76 + c * 52;
            const sy = 240 + r * 38;
            drawRoundedRect(ctx, sx - 8, sy - 4, 20, 8, 2, '#94A3B8', '#475569', 1);
            drawRoundedRect(ctx, sx - 13, sy - 8, 6, 15, 2, '#64748B', '#334155', 1);
            ctx.beginPath();
            ctx.arc(sx + 20, sy, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#CBD5E1';
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // NGĂN 4: Tấm lớn, tấm nhỏ có lỗ
    drawRoundedRect(ctx, 290, 210, 230, 150, 6, '#FFFFFF', '#94A3B8', 1.5);
    drawRoundedRect(ctx, 314, 228, 182, 112, 8, '#22C55E', '#15803D', 1.8);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
            ctx.beginPath();
            ctx.arc(336 + c * 27, 248 + r * 24, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
    }

    // --- DỤNG CỤ TUA-VÍT & CỜ-LÊ ĐẶT TRỰC QUAN BÊN PHẢI HỘP TRÊN MẶT BÀN GỖ ---
    // Tua-vít 3D cán đỏ lớn đặt dọc
    drawRoundedRect(ctx, 592, 64, 44, 118, 16, '#DC2626', '#991B1B', 2.2);
    drawRoundedRect(ctx, 600, 78, 8, 88, 4, '#EF4444');
    drawRoundedRect(ctx, 608, 182, 12, 136, 3, '#CBD5E1', '#475569', 1.8);
    ctx.beginPath();
    ctx.moveTo(605, 318);
    ctx.lineTo(623, 318);
    ctx.lineTo(618, 342);
    ctx.lineTo(610, 342);
    ctx.closePath();
    ctx.fillStyle = '#64748B';
    ctx.fill();

    // Cờ-lê thép 3D đặt cạnh tua-vít
    drawRoundedRect(ctx, 676, 104, 26, 210, 10, '#E2E8F0', '#475569', 2.2);
    ctx.beginPath();
    ctx.arc(689, 96, 26, 0.35, Math.PI * 2 - 0.35);
    ctx.arc(689, 322, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(689, 322, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#CFA36E';
    ctx.fill();
};

/**
 * 3. HÌNH ẢNH MÔ HÌNH KỸ THUẬT ĐÃ LẮP GHÉP ĐẶT TRÊN MẶT BÀN GỖ
 * (Hoàn toàn trực quan 3D: Mô hình máy phát điện gió hoặc mô hình xe cần cẩu lắp ghép trên bàn gỗ, không có nhánh mindmap)
 */
const drawAssembledTechnicalModelScene = (ctx: CanvasRenderingContext2D, primaryLower: string, _cleanDesc: string) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0F9FF');
    bgGrad.addColorStop(0.7, '#E0F2FE');
    bgGrad.addColorStop(1, '#BAE6FD');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    const isWindOrSolar =
        primaryLower.includes('gió') ||
        primaryLower.includes('mặt trời') ||
        primaryLower.includes('năng lượng');

    // Mặt bàn gỗ thực hành
    const tableGrad = ctx.createLinearGradient(0, 316, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 316, 736, 90, 8, tableGrad, '#78350F', 1.5);

    if (isWindOrSolar) {
        // Bóng đổ trên mặt bàn
        ctx.beginPath();
        ctx.ellipse(380, 354, 125, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();

        // Chân đế lắp ghép
        drawRoundedRect(ctx, 286, 318, 188, 28, 6, '#2563EB', '#1E3A8A', 2.2);
        // Cột trụ thanh thẳng có lỗ
        drawRoundedRect(ctx, 366, 126, 28, 194, 4, '#16A34A', '#14532D', 2.2);
        for (let y = 144; y < 306; y += 22) {
            ctx.beginPath();
            ctx.arc(380, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        // Hộp tuabin & 3 cánh quạt lớn
        drawRoundedRect(ctx, 348, 102, 64, 38, 8, '#F59E0B', '#B45309', 2.2);
        [0, 120, 240].forEach(deg => {
            ctx.save();
            ctx.translate(380, 121);
            ctx.rotate((deg * Math.PI) / 180);
            drawRoundedRect(ctx, -9, -96, 18, 86, 8, '#38BDF8', '#0284C7', 2);
            ctx.restore();
        });
        ctx.beginPath();
        ctx.arc(380, 121, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();

        // Đèn LED phát sáng kiểm tra dòng điện đặt cạnh chân đế
        drawRoundedRect(ctx, 510, 294, 76, 46, 8, '#1E293B', '#334155', 2);
        ctx.beginPath();
        ctx.arc(548, 276, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF08A';
        ctx.fill();
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    } else {
        // Bóng đổ mô hình xe kỹ thuật trên mặt bàn
        ctx.beginPath();
        ctx.ellipse(380, 348, 175, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();

        // Khung gầm xe (Thanh thẳng dài màu xanh)
        drawRoundedRect(ctx, 230, 256, 300, 28, 6, '#2563EB', '#1E3A8A', 2.2);
        for (let x = 250; x <= 510; x += 26) {
            ctx.beginPath();
            ctx.arc(x, 270, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        // Cabin & Giá đỡ (Thanh chữ U màu xanh lá)
        drawRoundedRect(ctx, 248, 172, 102, 84, 8, '#16A34A', '#14532D', 2.2);
        drawRoundedRect(ctx, 262, 186, 74, 46, 5, '#E0F2FE', '#0284C7', 1.8);

        // Cần cẩu / Giá nâng nghiêng (Thanh thẳng màu vàng + ròng rọc)
        ctx.save();
        ctx.translate(384, 256);
        ctx.rotate(-0.55);
        drawRoundedRect(ctx, 0, -16, 190, 24, 5, '#F59E0B', '#B45309', 2.2);
        for (let i = 18; i < 180; i += 24) {
            ctx.beginPath();
            ctx.arc(i, -4, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        ctx.restore();

        // Ròng rọc & dây móc cẩu ở đỉnh cần
        ctx.beginPath();
        ctx.arc(536, 152, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(536, 168);
        ctx.lineTo(536, 232);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();
        drawRoundedRect(ctx, 520, 232, 32, 28, 5, '#F97316', '#9A3412', 2);

        // Bánh xe trước & sau
        [292, 468].forEach(wx => {
            ctx.beginPath();
            ctx.arc(wx, 302, 38, 0, Math.PI * 2);
            ctx.fillStyle = '#1E293B';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx, 302, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#FACC15';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx, 302, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#475569';
            ctx.fill();
        });
    }
};

/**
 * 4. HÌNH ẢNH CẤU TẠO ĐÈN HỌC / ĐỒ DÙNG ĐIỆN ĐẶT TRỰC QUAN TRÊN BÀN HỌC
 * (Hoàn toàn trực quan 3D: Đèn học bật sáng trên bàn gỗ cạnh quyển sách mở và hộp bút, không có nhánh mindmap)
 */
const drawElectricalApplianceOrLampScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#1E293B');
    bgGrad.addColorStop(0.7, '#334155');
    bgGrad.addColorStop(1, '#475569');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#64748B', 2);

    // Mặt bàn gỗ ấm áp
    const tableGrad = ctx.createLinearGradient(0, 318, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 318, 736, 90, 8, tableGrad, '#78350F', 1.5);

    // Chùm sáng vàng ấm chiếu từ chụp đèn xuống trang sách trên bàn
    ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
    ctx.beginPath();
    ctx.moveTo(415, 168);
    ctx.lineTo(475, 122);
    ctx.lineTo(620, 348);
    ctx.lineTo(330, 348);
    ctx.closePath();
    ctx.fill();

    // Đế đèn học 3D
    ctx.beginPath();
    ctx.ellipse(355, 350, 96, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    drawRoundedRect(ctx, 270, 314, 170, 34, 14, '#0F172A', '#38BDF8', 2);
    // Công tắc bật/tắt màu đỏ nổi bật trên đế đèn
    drawRoundedRect(ctx, 338, 304, 38, 14, 5, '#EF4444', '#FCA5A5', 1.5);

    // Thân đèn uốn cong & khớp xoay
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(315, 314);
    ctx.lineTo(295, 188);
    ctx.lineTo(378, 98);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(295, 188, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();

    // Chụp đèn (Chao đèn)
    ctx.beginPath();
    ctx.moveTo(364, 82);
    ctx.lineTo(475, 122);
    ctx.lineTo(415, 176);
    ctx.closePath();
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Bóng đèn LED phát sáng rực rỡ bên trong chụp đèn
    ctx.beginPath();
    ctx.arc(432, 142, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Quyển sách mở dưới ánh đèn bên phải
    drawRoundedRect(ctx, 468, 312, 176, 36, 6, '#FFFFFF', '#0284C7', 2);
    ctx.beginPath();
    ctx.moveTo(556, 312);
    ctx.lineTo(556, 348);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ổ cắm điện trên tường & Dây nguồn phích cắm bên trái
    drawRoundedRect(ctx, 118, 250, 56, 56, 8, '#F8FAFC', '#CBD5E1', 2);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(270, 332);
    ctx.bezierCurveTo(210, 340, 195, 280, 156, 278);
    ctx.stroke();
    drawRoundedRect(ctx, 134, 266, 28, 24, 5, '#334155', '#0F172A', 1.8);
};

/**
 * 5. HÌNH ẢNH TRỰC QUAN CHẬU TRỒNG HOA, GIÁ THỂ (XƠ DỪA, TRẤU HUN, MÙN CƯA) & CÂY CẢNH
 */
const drawPlantAndGardeningScene = (ctx: CanvasRenderingContext2D, subjectLower: string = '') => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#ECFDF5');
    bgGrad.addColorStop(0.7, '#D1FAE5');
    bgGrad.addColorStop(1, '#A7F3D0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#10B981', 2);

    // Mặt bàn gỗ tự nhiên
    const tableGrad = ctx.createLinearGradient(0, 300, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(0.4, '#B45309');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 305, 736, 100, 8, tableGrad, '#78350F', 1.5);

    const isSubstrateTopic =
        subjectLower.includes('giá thể') ||
        subjectLower.includes('xơ dừa') ||
        subjectLower.includes('trấu hun') ||
        subjectLower.includes('mùn cưa') ||
        subjectLower.includes('đất trồng');

    const isPotTypesTopic =
        !isSubstrateTopic &&
        (subjectLower.includes('loại chậu') ||
            subjectLower.includes('chậu nhựa') ||
            subjectLower.includes('chậu sứ') ||
            subjectLower.includes('chậu đất nung') ||
            (subjectLower.includes('chậu') && !subjectLower.includes('gieo hạt')));

    if (isSubstrateTopic) {
        // Vẽ 3 khay/túi đựng giá thể thực tế trên mặt bàn gỗ: Xơ dừa, Trấu hun, Mùn cưa / Đất trồng
        const substrates = [
            { x: 75, name: 'Xơ dừa', topColor: '#9A3412', bodyColor: '#7C2D12', grainColor: '#B45309' },
            { x: 295, name: 'Trấu hun', topColor: '#1E293B', bodyColor: '#0F172A', grainColor: '#334155' },
            { x: 515, name: 'Mùn cưa / Đất mùn', topColor: '#CA8A04', bodyColor: '#854D0E', grainColor: '#EAB308' }
        ];

        substrates.forEach(sub => {
            // Bóng đổ trên mặt bàn
            ctx.beginPath();
            ctx.ellipse(sub.x + 85, 336, 78, 16, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fill();

            // Khay gỗ / Túi trong suốt chứa giá thể
            drawRoundedRect(ctx, sub.x, 155, 170, 175, 14, 'rgba(255,255,255,0.88)', '#CBD5E1', 2.5);

            // Khối giá thể bên trong
            drawRoundedRect(ctx, sub.x + 10, 195, 150, 125, 10, sub.bodyColor);
            ctx.beginPath();
            ctx.ellipse(sub.x + 85, 195, 75, 22, 0, 0, Math.PI * 2);
            ctx.fillStyle = sub.topColor;
            ctx.fill();

            // Hạt kết cấu tự nhiên của giá thể
            ctx.fillStyle = sub.grainColor;
            for (let i = 0; i < 28; i++) {
                const gx = sub.x + 22 + ((i * 37) % 126);
                const gy = 185 + ((i * 29) % 120);
                ctx.beginPath();
                ctx.arc(gx, gy, (i % 3) + 2, 0, Math.PI * 2);
                ctx.fill();
            }

            drawBadgeLabel(ctx, sub.name, sub.x + 85, 360, '#FFFFFF', '#78350F', '#451A03');
        });
    } else if (isPotTypesTopic) {
        // Vẽ 4 loại chậu trồng hoa, cây cảnh đặt cạnh nhau trên bàn gỗ (Chậu đất nung, Chậu gốm sứ, Chậu nhựa trắng, Chậu nhựa mềm)
        const pots = [
            { cx: 120, rimW: 116, topW: 104, botW: 68, h: 128, rimCol: '#C2410C', bodyCol: '#EA580C', stroke: '#7C2D12', label: 'Chậu đất nung' },
            { cx: 295, rimW: 118, topW: 108, botW: 72, h: 124, rimCol: '#0284C7', bodyCol: '#38BDF8', stroke: '#0369A1', label: 'Chậu gốm, sứ' },
            { cx: 470, rimW: 114, topW: 104, botW: 68, h: 120, rimCol: '#E2E8F0', bodyCol: '#F8FAFC', stroke: '#64748B', label: 'Chậu nhựa cứng' },
            { cx: 640, rimW: 106, topW: 98, botW: 64, h: 112, rimCol: '#334155', bodyCol: '#1E293B', stroke: '#0F172A', label: 'Chậu nhựa mềm' }
        ];

        pots.forEach(p => {
            const baseY = 328;
            const topY = baseY - p.h;

            // Bóng đổ trên bàn
            ctx.beginPath();
            ctx.ellipse(p.cx, baseY + 6, p.botW / 2 + 12, 11, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fill();

            // Thân chậu hình thang cân 3D
            ctx.beginPath();
            ctx.moveTo(p.cx - p.topW / 2, topY);
            ctx.lineTo(p.cx + p.topW / 2, topY);
            ctx.lineTo(p.cx + p.botW / 2, baseY);
            ctx.lineTo(p.cx - p.botW / 2, baseY);
            ctx.closePath();
            ctx.fillStyle = p.bodyCol;
            ctx.fill();
            ctx.strokeStyle = p.stroke;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Vành miệng chậu
            drawRoundedRect(ctx, p.cx - p.rimW / 2, topY - 14, p.rimW, 18, 5, p.rimCol, p.stroke, 2);
            // Lòng chậu phía trên
            ctx.beginPath();
            ctx.ellipse(p.cx, topY - 5, p.topW / 2 - 4, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#451A03';
            ctx.fill();

            drawBadgeLabel(ctx, p.label, p.cx, 362, '#FFFFFF', p.stroke, '#0F172A');
        });
    } else {
        // Vẽ chậu hoa, cây cảnh kèm bộ dụng cụ làm vườn cầm tay (xẻng nhỏ, bình tưới) trên mặt bàn gỗ
        // 1. Chậu cây cảnh ở giữa
        ctx.beginPath();
        ctx.ellipse(380, 332, 74, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(310, 200);
        ctx.lineTo(450, 200);
        ctx.lineTo(426, 330);
        ctx.lineTo(334, 330);
        ctx.closePath();
        ctx.fillStyle = '#EA580C';
        ctx.fill();
        ctx.strokeStyle = '#9A3412';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        drawRoundedRect(ctx, 298, 184, 164, 20, 6, '#C2410C', '#7C2D12', 2);
        ctx.beginPath();
        ctx.ellipse(380, 194, 72, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#451A03';
        ctx.fill();

        // Thân cây, lá và hoa
        ctx.strokeStyle = '#15803D';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(380, 194);
        ctx.lineTo(380, 88);
        ctx.stroke();

        [
            { x: 348, y: 150, ang: -0.5 },
            { x: 412, y: 142, ang: 0.5 },
            { x: 346, y: 116, ang: -0.4 },
            { x: 414, y: 108, ang: 0.4 }
        ].forEach(leaf => {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.ang);
            ctx.beginPath();
            ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#22C55E';
            ctx.fill();
            ctx.strokeStyle = '#14532D';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        });

        for (let a = 0; a < 6; a++) {
            const ang = (a * Math.PI) / 3;
            ctx.beginPath();
            ctx.arc(380 + Math.cos(ang) * 18, 72 + Math.sin(ang) * 18, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#F43F5E';
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(380, 72, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#FACC15';
        ctx.fill();

        // 2. Xẻng nhỏ làm vườn bên trái
        drawRoundedRect(ctx, 140, 286, 62, 18, 8, '#EF4444', '#991B1B', 1.8);
        drawRoundedRect(ctx, 200, 291, 24, 8, 3, '#64748B');
        ctx.beginPath();
        ctx.moveTo(222, 280);
        ctx.lineTo(275, 295);
        ctx.lineTo(222, 310);
        ctx.closePath();
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3. Bình tưới cây bên phải
        drawRoundedRect(ctx, 520, 225, 92, 102, 12, '#0EA5E9', '#0369A1', 2);
        ctx.strokeStyle = '#0369A1';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(612, 274, 24, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(520, 255);
        ctx.lineTo(476, 215);
        ctx.stroke();
    }
};

/**
 * 6. HÌNH ẢNH TRỰC QUAN MÀN HÌNH MÁY TÍNH HIỂN THỊ TRANG WEB ĐA PHƯƠNG TIỆN (VĂN BẢN, HÌNH ẢNH, VIDEO, ÂM THANH)
 * (Vẽ trực tiếp màn hình máy tính 3D đặt trên bàn gỗ hiển thị trang web trực quan - tuyệt đối không vẽ infographic hay mindmap)
 */
const drawWebpageInformationScene = (
    ctx: CanvasRenderingContext2D,
    primaryText: string,
    primaryLower: string
) => {
    const hasNumberedPositions =
        /đánh\s*số|vị\s*trí\s*(số\s*)?\d|số\s*1\s*,\s*2|1\s*,\s*2\s*,\s*3|\(1\)|\(2\)|hình\s*7/i.test(primaryLower);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0F9FF');
    bgGrad.addColorStop(0.75, '#E0F2FE');
    bgGrad.addColorStop(1, '#BAE6FD');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    // Mặt bàn gỗ 3D phía dưới
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#92400E');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);

    // Chân đế màn hình máy tính
    ctx.beginPath();
    ctx.ellipse(380, 366, 98, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fill();
    drawRoundedRect(ctx, 352, 306, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 348, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Khung màn hình máy tính 3D
    drawRoundedRect(ctx, 64, 20, 632, 292, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 78, 34, 604, 260, 8, '#F8FAFC', '#CBD5E1', 1.5);

    // Thanh trình duyệt Web
    drawRoundedRect(ctx, 78, 34, 604, 28, 6, '#0284C7');
    ['#EF4444', '#F59E0B', '#22C55E'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(96 + i * 15, 48, 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });
    drawRoundedRect(ctx, 150, 40, 514, 16, 8, '#FFFFFF', '#BAE6FD', 1);

    // Khu vực 1: Bài viết văn bản trên trang web (bên trái)
    drawRoundedRect(ctx, 92, 74, 256, 206, 8, '#FFFFFF', '#93C5FD', 1.5);
    drawRoundedRect(ctx, 106, 90, 180, 14, 4, '#1D4ED8');
    for (let i = 0; i < 6; i++) {
        drawRoundedRect(ctx, 106, 118 + i * 20, i === 5 ? 140 : 224, 9, 4, i % 2 === 0 ? '#64748B' : '#94A3B8');
    }
    // Dòng liên kết siêu văn bản màu xanh có gạch chân
    drawRoundedRect(ctx, 106, 246, 165, 10, 4, '#0284C7');

    // Khu vực 2: Khung tranh phong cảnh trên trang web (giữa)
    drawRoundedRect(ctx, 360, 74, 150, 206, 8, '#FFFFFF', '#86EFAC', 1.5);
    drawRoundedRect(ctx, 372, 88, 126, 156, 6, '#E0F2FE', '#38BDF8', 1.2);
    ctx.beginPath();
    ctx.arc(402, 118, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(372, 232);
    ctx.lineTo(414, 168);
    ctx.lineTo(450, 210);
    ctx.lineTo(476, 182);
    ctx.lineTo(498, 232);
    ctx.closePath();
    ctx.fillStyle = '#22C55E';
    ctx.fill();

    // Khu vực 3: Trình phát Video & Loa âm thanh trên trang web (bên phải)
    drawRoundedRect(ctx, 522, 74, 146, 206, 8, '#FFFFFF', '#FDBA74', 1.5);
    drawRoundedRect(ctx, 534, 88, 122, 106, 6, '#1E293B', '#475569', 1.2);
    ctx.beginPath();
    ctx.arc(595, 141, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(589, 131);
    ctx.lineTo(606, 141);
    ctx.lineTo(589, 151);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Thanh sóng âm thanh trực quan phía dưới trình phát video
    drawRoundedRect(ctx, 534, 208, 122, 54, 6, '#FFF7ED', '#FB923C', 1.2);
    const waveBars = [14, 28, 36, 20, 32, 16, 26, 12];
    waveBars.forEach((bh, idx) => {
        drawRoundedRect(ctx, 548 + idx * 12, 235 - bh / 2, 6, bh, 3, '#EA580C');
    });

    if (hasNumberedPositions) {
        drawNumberedCalloutCircle(ctx, 1, 330, 92, 13);
        drawNumberedCalloutCircle(ctx, 2, 492, 92, 13);
        drawNumberedCalloutCircle(ctx, 3, 650, 92, 13);
    }
};

/**
 * 7. HÌNH ẢNH TRỰC QUAN MÀN HÌNH ĐA PHƯƠNG TIỆN & LOA MÁY TÍNH TRÊN BÀN GỖ
 * (Không vẽ bảng 4 cột infographic - vẽ trực tiếp bộ máy tính hiển thị văn bản, tranh ảnh, video và cặp loa phát âm thanh)
 */
const drawMultimediaTypesOnScreenScene = (ctx: CanvasRenderingContext2D) => {
    drawWebpageInformationScene(ctx, '', '');

    // Vẽ thêm cặp loa vật lý hai bên màn hình trên mặt bàn gỗ để thể hiện trực quan âm thanh phát ra
    drawRoundedRect(ctx, 18, 226, 40, 122, 8, '#1E293B', '#475569', 2);
    ctx.beginPath();
    ctx.arc(38, 262, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(38, 308, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();

    drawRoundedRect(ctx, 702, 226, 40, 122, 8, '#1E293B', '#475569', 2);
    ctx.beginPath();
    ctx.arc(722, 262, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(722, 308, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
};

/**
 * 8. HÌNH ẢNH TRỰC QUAN THÂN MÁY TÍNH, CÁC CỔNG KẾT NỐI VẬT LÝ (USB, HDMI, ÂM THANH) & ĐẦU DÂY CÁP TRÊN BÀN
 * (Tuyệt đối không vẽ bảng Bước 1, Bước 2, Bước 3 dạng infographic)
 */
const drawConnectionPortsAndTroubleshootingScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(0.7, '#E2E8F0');
    bgGrad.addColorStop(1, '#CBD5E1');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#475569', 2);

    // Mặt bàn gỗ phía dưới
    const tableGrad = ctx.createLinearGradient(0, 310, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 312, 736, 94, 8, tableGrad, '#78350F', 1.5);

    // Thân máy tính (Case CPU) 3D nhìn cận cảnh bảng cổng kết nối (bên trái)
    ctx.beginPath();
    ctx.ellipse(230, 354, 130, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();
    drawRoundedRect(ctx, 96, 44, 268, 306, 14, '#1E293B', '#0F172A', 3);
    drawRoundedRect(ctx, 118, 66, 224, 262, 10, '#334155', '#64748B', 2);

    // Cổng USB vật lý (màu xanh dương)
    drawRoundedRect(ctx, 146, 92, 78, 34, 4, '#0F172A', '#94A3B8', 2);
    drawRoundedRect(ctx, 156, 100, 58, 12, 2, '#2563EB');

    drawRoundedRect(ctx, 146, 142, 78, 34, 4, '#0F172A', '#94A3B8', 2);
    drawRoundedRect(ctx, 156, 150, 58, 12, 2, '#2563EB');

    // Cổng HDMI vật lý (vát hai góc dưới)
    drawRoundedRect(ctx, 146, 196, 86, 34, 5, '#0F172A', '#F59E0B', 2);
    drawRoundedRect(ctx, 158, 207, 62, 10, 2, '#D97706');

    // Cổng âm thanh 3.5mm (xanh lá & hồng) và cổng mạng LAN
    ctx.beginPath();
    ctx.arc(168, 272, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(168, 272, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(208, 272, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#EC4899';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(208, 272, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    drawRoundedRect(ctx, 246, 252, 66, 42, 4, '#0F172A', '#38BDF8', 2);
    drawRoundedRect(ctx, 258, 262, 42, 22, 2, '#FACC15');

    // Các đầu dây cáp USB, cáp HDMI và chuột máy tính đặt trực quan bên phải đang hướng vào cổng cắm
    // 1. Đầu cáp USB
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(520, 109);
    ctx.bezierCurveTo(600, 109, 640, 160, 680, 250);
    ctx.stroke();
    drawRoundedRect(ctx, 434, 91, 88, 36, 6, '#2563EB', '#1E3A8A', 2);
    drawRoundedRect(ctx, 398, 97, 38, 24, 3, '#E2E8F0', '#64748B', 2);
    drawRoundedRect(ctx, 406, 102, 12, 6, 1, '#475569');
    drawRoundedRect(ctx, 406, 111, 12, 6, 1, '#475569');

    // 2. Đầu cáp HDMI
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(530, 213);
    ctx.bezierCurveTo(610, 213, 660, 260, 710, 340);
    ctx.stroke();
    drawRoundedRect(ctx, 438, 193, 94, 40, 8, '#334155', '#0F172A', 2);
    drawRoundedRect(ctx, 400, 201, 40, 24, 3, '#F59E0B', '#B45309', 2);

    // 3. Chuột máy tính có đèn tín hiệu đặt trên mặt bàn gỗ
    ctx.beginPath();
    ctx.ellipse(585, 362, 56, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();
    drawRoundedRect(ctx, 540, 286, 90, 72, 36, '#FFFFFF', '#334155', 2.5);
    drawRoundedRect(ctx, 581, 294, 8, 22, 4, '#EF4444');
};

/**
 * 9. DANH MỤC ĐỐI TƯỢNG PHẦN CỨNG & PHẦN MỀM CỤ THỂ
 */
interface SpecificCatalogItem {
    id: string;
    keywords: string[];
    title: string;
    category: 'PHẦN CỨNG MÁY TÍNH' | 'PHẦN MỀM MÁY TÍNH';
    subtitle: string;
    color: string;
    bg: string;
}

const SPECIFIC_HARDWARE_SOFTWARE_CATALOG: SpecificCatalogItem[] = [
    {
        id: 'printer',
        keywords: ['máy in'],
        title: 'MÁY IN (PRINTER)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#0284C7',
        bg: '#F0F9FF'
    },
    {
        id: 'hdd',
        keywords: ['ổ đĩa cứng', 'ổ cứng'],
        title: 'Ổ ĐĨA CỨNG (HDD / SSD)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#2563EB',
        bg: '#EFF6FF'
    },
    {
        id: 'usb_drive',
        keywords: ['usb', 'thẻ nhớ', 'bộ nhớ ngoài'],
        title: 'THIẾT BỊ NHỚ USB',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#0D9488',
        bg: '#F0FDFA'
    },
    {
        id: 'speaker',
        keywords: ['loa máy tính', 'loa', 'tai nghe'],
        title: 'LOA MÁY TÍNH (SPEAKER)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#4F46E5',
        bg: '#EEF2FF'
    },
    {
        id: 'monitor',
        keywords: ['màn hình'],
        title: 'MÀN HÌNH (MONITOR)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#0369A1',
        bg: '#F0F9FF'
    },
    {
        id: 'keyboard_mouse',
        keywords: ['bàn phím', 'chuột máy tính'],
        title: 'BÀN PHÍM & CHUỘT',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: '',
        color: '#1D4ED8',
        bg: '#EFF6FF'
    },
    {
        id: 'typing_app',
        keywords: ['luyện gõ bàn phím', 'phần mềm luyện gõ', 'rapidtyping', 'ứng dụng luyện gõ'],
        title: 'ỨNG DỤNG LUYỆN GÕ BÀN PHÍM',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: '',
        color: '#16A34A',
        bg: '#F0FDF4'
    },
    {
        id: 'word_app',
        keywords: ['phần mềm soạn thảo', 'microsoft word', 'ứng dụng soạn thảo'],
        title: 'PHẦN MỀM SOẠN THẢO WORD',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: '',
        color: '#15803D',
        bg: '#F0FDF4'
    },
    {
        id: 'paint_app',
        keywords: ['phần mềm vẽ', 'ms paint', 'ứng dụng vẽ'],
        title: 'PHẦN MỀM ĐỒ HỌA PAINT',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: '',
        color: '#D97706',
        bg: '#FFFBEB'
    },
    {
        id: 'browser_app',
        keywords: ['trình duyệt web', 'google chrome', 'cốc cốc'],
        title: 'TRÌNH DUYỆT WEB (CHROME)',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: '',
        color: '#EA580C',
        bg: '#FFF7ED'
    }
];

const drawCatalogItemIllustration = (
    ctx: CanvasRenderingContext2D,
    itemId: string,
    cx: number,
    cy: number,
    color: string
) => {
    ctx.save();
    if (itemId === 'printer') {
        drawRoundedRect(ctx, cx - 44, cy - 52, 88, 34, 4, '#FFFFFF', '#64748B', 2);
        drawRoundedRect(ctx, cx - 68, cy - 22, 136, 56, 10, '#334155', color, 2.5);
        drawRoundedRect(ctx, cx - 48, cy + 22, 96, 38, 4, '#FFFFFF', '#3B82F6', 2);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy + 35);
        ctx.lineTo(cx + 32, cy + 35);
        ctx.moveTo(cx - 32, cy + 47);
        ctx.lineTo(cx + 18, cy + 47);
        ctx.stroke();
    } else if (itemId === 'hdd') {
        drawRoundedRect(ctx, cx - 54, cy - 52, 108, 104, 12, '#1E293B', color, 2.5);
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 34, 0, Math.PI * 2);
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + 32, cy + 34);
        ctx.lineTo(cx + 4, cy + 6);
        ctx.stroke();
    } else if (itemId === 'typing_app') {
        drawRoundedRect(ctx, cx - 64, cy - 48, 128, 96, 10, '#FFFFFF', color, 2.5);
        drawRoundedRect(ctx, cx - 64, cy - 48, 128, 22, 8, color);
        ['F', 'J', 'D', 'K'].forEach((k, idx) => {
            drawRoundedRect(ctx, cx - 50 + idx * 26, cy - 16, 22, 22, 5, '#DCFCE7', '#16A34A', 1.5);
            ctx.fillStyle = '#15803D';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(k, cx - 39 + idx * 26, cy - 2);
        });
        drawRoundedRect(ctx, cx - 48, cy + 16, 96, 20, 5, '#EFF6FF', '#3B82F6', 1.2);
    } else if (itemId === 'usb_drive') {
        drawRoundedRect(ctx, cx - 58, cy - 18, 32, 36, 4, '#94A3B8', '#475569', 2);
        drawRoundedRect(ctx, cx - 26, cy - 26, 86, 52, 10, color, '#0F172A', 2.5);
    } else if (itemId === 'speaker') {
        drawRoundedRect(ctx, cx - 44, cy - 50, 88, 100, 12, '#1E293B', color, 2.5);
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - 26, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
    } else {
        drawRoundedRect(ctx, cx - 58, cy - 44, 116, 88, 10, '#1E293B', color, 2.5);
        drawRoundedRect(ctx, cx - 48, cy - 34, 96, 64, 6, '#38BDF8');
    }
    ctx.restore();
};

/**
 * Vẽ trực tiếp các thiết bị phần cứng & màn hình phần mềm đặt trên mặt bàn gỗ 3D
 * (Tuyệt đối không vẽ 3 thẻ chữ Infographic)
 */
const drawSpecificItemsCardsScene = (
    ctx: CanvasRenderingContext2D,
    matchedItems: SpecificCatalogItem[],
    _isClassifyExercise: boolean
) => {
    const items = matchedItems.slice(0, 3);
    while (items.length < 3) {
        const fallback = SPECIFIC_HARDWARE_SOFTWARE_CATALOG.find(c => !items.some(i => i.id === c.id));
        if (fallback) items.push(fallback);
        else break;
    }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0F9FF');
    bgGrad.addColorStop(0.7, '#E0F2FE');
    bgGrad.addColorStop(1, '#BAE6FD');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    // Mặt bàn gỗ 3D
    const tableGrad = ctx.createLinearGradient(0, 290, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(0.5, '#B45309');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 294, 736, 112, 8, tableGrad, '#78350F', 1.5);

    const positions = [150, 380, 610];
    items.forEach((it, idx) => {
        const cx = positions[idx];
        const cy = 225;

        // Bóng đổ trên mặt bàn gỗ
        ctx.beginPath();
        ctx.ellipse(cx, 326, 86, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
        ctx.fill();

        // Đế trưng bày vật phẩm 3D
        drawRoundedRect(ctx, cx - 88, 128, 176, 192, 16, '#FFFFFF', it.color, 2.5);
        drawCatalogItemIllustration(ctx, it.id, cx, cy, it.color);
    });
};

/**
/**
 * 10. HÌNH ẢNH TRỰC QUAN BỘ MÁY TÍNH ĐỂ BÀN & CÁC BỘ PHẬN LINH KIỆN TRÊN BÀN GỖ SÁNG MÀU
 * (Bố cục trực quan như ảnh chụp thực tế trên mặt bàn gỗ: Màn hình, Thùng máy (Case), Loa, Bàn phím, Chuột,
 *  Bo mạch chủ (Mainboard), Bộ vi xử lý (CPU), Bộ nhớ RAM, Card đồ họa (VGA), Ổ cứng (SSD/HDD), Nguồn (PSU))
 */
const drawHardwareSoftwareOverviewScene = (ctx: CanvasRenderingContext2D) => {
    // Nền tường phòng học / studio sáng ấm
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 185);
    wallGrad.addColorStop(0, '#F5F0EB');
    wallGrad.addColorStop(1, '#E6DDD3');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, wallGrad, '#CBD5E1', 2);

    // Mặt bàn gỗ sồi sáng màu trải rộng (góc nhìn từ trên cao chếch xuống)
    const deskGrad = ctx.createLinearGradient(0, 148, 0, 412);
    deskGrad.addColorStop(0, '#E7CBA9');
    deskGrad.addColorStop(0.5, '#DEC09A');
    deskGrad.addColorStop(1, '#CFA97E');
    drawRoundedRect(ctx, 8, 150, 744, 262, 10, deskGrad, '#B89064', 1.5);

    const drawPartLabelTag = (text: string, cx: number, cy: number, targetX?: number, targetY?: number) => {
        ctx.save();
        if (targetX !== undefined && targetY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.font = 'bold 13px Arial, sans-serif';
        const lines = text.split('\n');
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        const boxW = maxW + 16;
        const boxH = lines.length * 16 + 8;
        drawRoundedRect(
            ctx,
            cx - boxW / 2,
            cy - boxH / 2,
            boxW,
            boxH,
            6,
            'rgba(255, 255, 255, 0.94)',
            '#CBD5E1',
            1.2
        );
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, idx) => {
            const yOffset = (idx - (lines.length - 1) / 2) * 15;
            ctx.fillText(line, cx, cy + yOffset);
        });
        ctx.restore();
    };

    // 1. Màn hình máy tính (Trung tâm phía trên)
    // Chân đế chữ V
    ctx.beginPath();
    ctx.moveTo(355, 142);
    ctx.lineTo(285, 186);
    ctx.lineTo(295, 192);
    ctx.lineTo(360, 154);
    ctx.lineTo(425, 192);
    ctx.lineTo(435, 186);
    ctx.lineTo(365, 142);
    ctx.closePath();
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    drawRoundedRect(ctx, 348, 122, 24, 30, 3, '#334155');
    // Khung màn hình Windows xanh dương sắc nét
    drawRoundedRect(ctx, 212, 18, 296, 114, 6, '#0F172A', '#334155', 3);
    const screenGrad = ctx.createLinearGradient(218, 24, 502, 126);
    screenGrad.addColorStop(0, '#0284C7');
    screenGrad.addColorStop(1, '#0369A1');
    drawRoundedRect(ctx, 218, 24, 284, 100, 3, screenGrad);
    // Cửa sổ biểu tượng Windows trên nền màn hình
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fillRect(410, 48, 22, 18);
    ctx.fillRect(435, 48, 22, 18);
    ctx.fillRect(410, 69, 22, 18);
    ctx.fillRect(435, 69, 22, 18);
    // Thanh Taskbar
    drawRoundedRect(ctx, 218, 118, 284, 6, 1, '#0F172A');

    // 2. Hai Loa máy tính đặt 2 bên màn hình
    // Loa trái
    drawRoundedRect(ctx, 156, 106, 44, 72, 6, '#1E293B', '#0F172A', 2);
    ctx.beginPath();
    ctx.arc(178, 128, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(178, 154, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    // Loa phải
    drawRoundedRect(ctx, 514, 106, 44, 72, 6, '#1E293B', '#0F172A', 2);
    ctx.beginPath();
    ctx.arc(536, 128, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(536, 154, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();

    // 3. Thùng máy (Case) bên phải có quạt LED RGB
    drawRoundedRect(ctx, 578, 22, 148, 184, 8, '#1E293B', '#0F172A', 3);
    drawRoundedRect(ctx, 586, 32, 88, 164, 5, '#0F172A', '#475569', 1.5);
    // Quạt LED RGB bên trong Case
    const rgbGrad = ctx.createRadialGradient(618, 74, 4, 618, 74, 24);
    rgbGrad.addColorStop(0, '#FFFFFF');
    rgbGrad.addColorStop(0.5, '#38BDF8');
    rgbGrad.addColorStop(1, '#EC4899');
    ctx.beginPath();
    ctx.arc(618, 74, 22, 0, Math.PI * 2);
    ctx.fillStyle = rgbGrad;
    ctx.fill();
    drawRoundedRect(ctx, 682, 34, 36, 160, 4, '#0F172A', '#334155', 1.5);

    // 4. Bàn phím LED & Chuột ở hàng giữa mặt bàn
    drawRoundedRect(ctx, 262, 198, 198, 56, 6, '#1E293B', '#0F172A', 2.5);
    const keyColors = ['#EF4444', '#F59E0B', '#22C55E', '#38BDF8', '#A855F7'];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 13; c++) {
            drawRoundedRect(
                ctx,
                270 + c * 14.2,
                205 + r * 11.5,
                11,
                8.5,
                2,
                '#334155',
                keyColors[(r + c) % keyColors.length],
                0.9
            );
        }
    }
    // Chuột máy tính
    drawRoundedRect(ctx, 488, 208, 34, 52, 16, '#1E293B', '#0F172A', 2);
    drawRoundedRect(ctx, 503, 214, 4, 12, 2, '#64748B');

    // 5. Bo mạch chủ (Mainboard) góc dưới bên trái
    drawRoundedRect(ctx, 56, 226, 134, 144, 6, '#1E293B', '#475569', 2);
    drawRoundedRect(ctx, 66, 234, 46, 24, 3, '#64748B');
    // Socket CPU trên mainboard
    drawRoundedRect(ctx, 114, 254, 34, 34, 3, '#CBD5E1', '#475569', 1.5);
    // Khe cắm RAM & PCIe
    for (let i = 0; i < 4; i++) {
        drawRoundedRect(ctx, 156 + i * 6, 242, 3.5, 52, 1, '#334155');
    }
    drawRoundedRect(ctx, 76, 304, 78, 8, 2, '#94A3B8');
    drawRoundedRect(ctx, 76, 322, 78, 8, 2, '#94A3B8');
    drawRoundedRect(ctx, 136, 336, 42, 24, 3, '#64748B');

    // 6. Bộ vi xử lý (CPU)
    drawRoundedRect(ctx, 208, 244, 28, 28, 4, '#CBD5E1', '#0F766E', 2);
    drawRoundedRect(ctx, 213, 249, 18, 18, 2, '#E2E8F0', '#64748B', 1);

    // 7. Bộ nhớ RAM (2 thanh RAM)
    drawRoundedRect(ctx, 202, 298, 16, 68, 2, '#1E293B', '#CA8A04', 1.5);
    drawRoundedRect(ctx, 226, 298, 16, 68, 2, '#1E293B', '#CA8A04', 1.5);

    // 8. Card đồ họa (VGA - 2 quạt tản nhiệt)
    drawRoundedRect(ctx, 284, 296, 136, 68, 8, '#1E293B', '#475569', 2);
    [324, 382].forEach(fx => {
        ctx.beginPath();
        ctx.arc(fx, 330, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, 330, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
    });

    // 9. Ổ cứng (SSD & HDD)
    drawRoundedRect(ctx, 452, 306, 42, 56, 4, '#334155', '#1E293B', 1.8);
    drawRoundedRect(ctx, 462, 322, 22, 16, 2, '#94A3B8');
    drawRoundedRect(ctx, 502, 298, 52, 66, 4, '#E2E8F0', '#64748B', 1.8);
    drawRoundedRect(ctx, 510, 308, 36, 42, 2, '#FFFFFF', '#22C55E', 1.2);

    // 10. Nguồn máy tính (PSU) kèm bó dây nguồn
    drawRoundedRect(ctx, 584, 286, 108, 82, 6, '#1E293B', '#0F172A', 2.5);
    ctx.beginPath();
    ctx.arc(632, 327, 28, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Bó dây nguồn bọc lưới đen-vàng-đỏ bên phải PSU
    drawRoundedRect(ctx, 694, 292, 34, 74, 14, '#0F172A', '#F59E0B', 2);

    // Các nhãn tên bộ phận tiếng Việt chuẩn xác như hình mẫu
    drawPartLabelTag('Màn hình', 96, 62, 212, 48);
    drawPartLabelTag('Loa', 536, 74, 536, 106);
    drawPartLabelTag('Thùng máy (Case)', 664, 22);
    drawPartLabelTag('Bàn phím', 360, 176);
    drawPartLabelTag('Chuột', 505, 276);
    drawPartLabelTag('Bo mạch chủ\n(Mainboard)', 98, 194, 118, 226);
    drawPartLabelTag('Bộ vi xử lý\n(CPU)', 222, 210, 222, 244);
    drawPartLabelTag('Bộ nhớ\nRAM', 220, 390);
    drawPartLabelTag('Card đồ họa\n(VGA)', 352, 390);
    drawPartLabelTag('Ổ cứng\n(SSD/HDD)', 498, 390);
    drawPartLabelTag('Nguồn (PSU)', 656, 256, 638, 286);
};

/**
 * 11. HÌNH ẢNH TRỰC QUAN BÀN PHÍM MÁY TÍNH 3D & HAI BÀN TAY ĐẶT TRÊN HÀNG PHÍM CƠ SỞ (PHÍM CÓ GAI F VÀ J)
 */
const drawKeyboardErgonomicsScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#FEF3C7');
    bgGrad.addColorStop(1, '#FDE68A');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#D97706', 2);

    // Mặt bàn gỗ
    const tableGrad = ctx.createLinearGradient(0, 40, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 24, 736, 382, 10, tableGrad, '#78350F', 1.5);

    // Khung bàn phím máy tính 3D nhìn từ trên xuống
    drawRoundedRect(ctx, 44, 46, 672, 274, 16, '#1E293B', '#0F172A', 3);
    drawRoundedRect(ctx, 58, 60, 644, 246, 12, '#334155', '#475569', 2);

    const rows = [
        { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], y: 74, color: '#E2E8F0', border: '#94A3B8' },
        { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], y: 124, color: '#DBEAFE', border: '#3B82F6' },
        { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'], y: 174, color: '#FEF3C7', border: '#D97706' },
        { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'], y: 224, color: '#DCFCE7', border: '#16A34A' }
    ];

    rows.forEach((r, rIdx) => {
        const offsetX = rIdx * 8;
        r.keys.forEach((k, idx) => {
            const kx = 86 + offsetX + idx * 56;
            const isHomeFinger = rIdx === 2 && ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'].includes(k);
            drawRoundedRect(
                ctx,
                kx,
                r.y,
                48,
                42,
                7,
                isHomeFinger ? '#FDE047' : r.color,
                isHomeFinger ? '#B45309' : r.border,
                isHomeFinger ? 2.5 : 1.5
            );
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(k, kx + 24, r.y + 22);

            // Gai định vị nổi bật trên phím F và J
            if (k === 'F' || k === 'J') {
                drawRoundedRect(ctx, kx + 15, r.y + 32, 18, 4, 2, '#DC2626');
            }
        });
    });

    // Phím Cách (Spacebar)
    drawRoundedRect(ctx, 226, 270, 308, 28, 6, '#F1F5F9', '#64748B', 2);

    // Hình ảnh trực quan hai bàn tay đặt nhẹ lên hàng phím cơ sở
    ctx.save();
    ctx.fillStyle = 'rgba(253, 186, 116, 0.82)';
    ctx.strokeStyle = '#C2410C';
    ctx.lineWidth = 2;

    // Các ngón tay trái đặt trên A, S, D, F và ngón cái trên Spacebar
    [102 + 16, 158 + 16, 214 + 16, 270 + 16].forEach((fx, i) => {
        drawRoundedRect(ctx, fx - 12, 192 + (i === 0 ? 12 : 0), 24, 96, 12, 'rgba(253, 186, 116, 0.85)', '#EA580C', 2);
    });
    // Lòng bàn tay trái
    ctx.beginPath();
    ctx.ellipse(215, 338, 68, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Các ngón tay phải đặt trên J, K, L, ;
    [438 + 16, 494 + 16, 550 + 16, 606 + 16].forEach((fx, i) => {
        drawRoundedRect(ctx, fx - 12, 192 + (i === 3 ? 12 : 0), 24, 96, 12, 'rgba(253, 186, 116, 0.85)', '#EA580C', 2);
    });
    // Lòng bàn tay phải
    ctx.beginPath();
    ctx.ellipse(545, 338, 68, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * 12. HÌNH ẢNH TRỰC QUAN MÀN HÌNH MÁY TÍNH HIỂN THỊ CÔNG CỤ TÌM KIẾM TRÊN INTERNET
 */
const drawSearchEngineScene = (ctx: CanvasRenderingContext2D, _primaryText: string) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#EFF6FF');
    bgGrad.addColorStop(1, '#BFDBFE');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#2563EB', 2);

    // Mặt bàn gỗ
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);

    // Chân đế màn hình
    drawRoundedRect(ctx, 352, 304, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 346, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Màn hình máy tính 3D
    drawRoundedRect(ctx, 74, 22, 612, 286, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 88, 36, 584, 254, 8, '#FFFFFF', '#CBD5E1', 1.5);

    // Thanh trình duyệt
    drawRoundedRect(ctx, 88, 36, 584, 28, 6, '#0284C7');
    ['#EF4444', '#F59E0B', '#22C55E'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(106 + i * 15, 50, 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });
    drawRoundedRect(ctx, 160, 42, 496, 16, 8, '#FFFFFF');

    // Biểu tượng màu sắc của máy tìm kiếm
    const logoColors = ['#2563EB', '#EA4335', '#FBBC05', '#2563EB', '#34A853', '#EA4335'];
    logoColors.forEach((col, idx) => {
        ctx.beginPath();
        ctx.arc(318 + idx * 24, 92, 9, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });

    // Thanh ô tìm kiếm và kính lúp trực quan
    drawRoundedRect(ctx, 166, 118, 428, 40, 20, '#F8FAFC', '#2563EB', 2.5);
    ctx.beginPath();
    ctx.arc(194, 138, 9, 0, Math.PI * 2);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(201, 145);
    ctx.lineTo(209, 153);
    ctx.stroke();

    drawRoundedRect(ctx, 222, 132, 240, 12, 6, '#3B82F6');
    drawRoundedRect(ctx, 526, 124, 58, 28, 14, '#2563EB');

    // Các thẻ kết quả tìm kiếm trực quan có thumbnail hình ảnh và dòng mô tả
    [174, 232].forEach((ry, idx) => {
        drawRoundedRect(ctx, 124, ry, 512, 48, 8, '#F8FAFC', '#CBD5E1', 1.5);
        drawRoundedRect(ctx, 136, ry + 8, 56, 32, 4, idx === 0 ? '#DBEAFE' : '#DCFCE7', idx === 0 ? '#3B82F6' : '#22C55E', 1.2);
        drawRoundedRect(ctx, 204, ry + 10, 210, 10, 4, '#1D4ED8');
        drawRoundedRect(ctx, 204, ry + 26, 320, 8, 4, '#64748B');
    });
};

/**
 * 13. HÌNH ẢNH TRỰC QUAN KHIÊN BẢO MẬT, Ổ KHÓA MẬT KHẨU & MÀN HÌNH MÁY TÍNH AN TOÀN
 * (Tuyệt đối không vẽ 4 ô chữ quy tắc kiểu infographic)
 */
const drawDigitalSafetyScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#ECFDF5');
    bgGrad.addColorStop(1, '#A7F3D0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#10B981', 2);

    // Mặt bàn gỗ
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);

    // Chân đế & Màn hình máy tính
    drawRoundedRect(ctx, 352, 304, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 346, 168, 16, 8, '#64748B', '#1E293B', 2);
    drawRoundedRect(ctx, 96, 26, 568, 282, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 110, 40, 540, 250, 8, '#F8FAFC', '#CBD5E1', 1.5);

    // Khung đăng nhập bảo mật ở trung tâm màn hình
    drawRoundedRect(ctx, 160, 72, 260, 186, 12, '#FFFFFF', '#0284C7', 2);
    // Avatar người dùng
    ctx.beginPath();
    ctx.arc(290, 114, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#DBEAFE';
    ctx.fill();
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(290, 108, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();

    // Ô mật khẩu có các dấu sao/chấm tròn bảo mật
    drawRoundedRect(ctx, 190, 154, 200, 34, 8, '#F1F5F9', '#3B82F6', 1.8);
    for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(214 + i * 24, 171, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
    }
    drawRoundedRect(ctx, 230, 204, 120, 32, 8, '#16A34A');

    // Chiếc khiên bảo vệ & ổ khóa vàng 3D trực quan bên phải màn hình
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(526, 76);
    ctx.lineTo(598, 102);
    ctx.lineTo(598, 172);
    ctx.quadraticCurveTo(598, 232, 526, 260);
    ctx.quadraticCurveTo(454, 232, 454, 172);
    ctx.lineTo(454, 102);
    ctx.closePath();
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#047857';
    ctx.stroke();

    // Ổ khóa 3D bên trong khiên
    ctx.beginPath();
    ctx.arc(526, 148, 20, Math.PI, 0, false);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FEF08A';
    ctx.stroke();
    drawRoundedRect(ctx, 498, 148, 56, 46, 8, '#FACC15', '#CA8A04', 2.5);
    ctx.beginPath();
    ctx.arc(526, 168, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#713F12';
    ctx.fill();
    ctx.restore();
};

/**
 * 14. HÌNH ẢNH TRỰC QUAN CỬA SỔ QUẢN LÝ TỆP VÀ THƯ MỤC TRÊN MÀN HÌNH MÁY TÍNH
 */
const drawFileFolderScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0F9FF');
    bgGrad.addColorStop(1, '#BAE6FD');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    // Mặt bàn gỗ & chân màn hình
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);
    drawRoundedRect(ctx, 352, 304, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 346, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Khung màn hình máy tính
    drawRoundedRect(ctx, 64, 20, 632, 290, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 78, 34, 604, 258, 8, '#FFFFFF', '#CBD5E1', 1.5);

    // Thanh tiêu đề File Explorer
    drawRoundedRect(ctx, 78, 34, 604, 28, 6, '#F59E0B');
    ['#EF4444', '#FBBF24', '#22C55E'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(96 + i * 15, 48, 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });

    // Ngăn bên trái: Cây thư mục trực quan bằng biểu tượng Folder
    drawRoundedRect(ctx, 90, 72, 170, 208, 6, '#F8FAFC', '#CBD5E1', 1.5);
    [0, 1, 2, 3, 4].forEach(idx => {
        const indent = idx === 0 ? 0 : idx === 1 ? 14 : 28;
        const fy = 88 + idx * 36;
        drawRoundedRect(ctx, 104 + indent, fy, 24, 18, 3, idx === 2 ? '#F59E0B' : '#FBBF24', '#D97706', 1.2);
        drawRoundedRect(ctx, 134 + indent, fy + 5, 76, 8, 4, idx === 2 ? '#2563EB' : '#94A3B8');
    });

    // Ngăn bên phải: Các biểu tượng Thư mục màu vàng 3D và Tệp tài liệu trực quan
    drawRoundedRect(ctx, 272, 72, 396, 208, 6, '#FFFFFF', '#CBD5E1', 1.5);
    const folderCols = [302, 422, 542];
    folderCols.forEach(fx => {
        // Biểu tượng Folder 3D màu vàng
        drawRoundedRect(ctx, fx, 94, 34, 10, 3, '#D97706');
        drawRoundedRect(ctx, fx, 100, 84, 58, 6, '#FBBF24', '#D97706', 2);
        drawRoundedRect(ctx, fx + 12, 166, 60, 8, 4, '#64748B');
    });

    // Hàng dưới: Các biểu tượng tệp tin (Văn bản, Hình ảnh, Trình chiếu)
    const fileColors = ['#2563EB', '#16A34A', '#EA580C'];
    folderCols.forEach((fx, i) => {
        drawRoundedRect(ctx, fx + 12, 190, 60, 68, 6, '#F8FAFC', fileColors[i], 2);
        drawRoundedRect(ctx, fx + 22, 204, 40, 14, 3, fileColors[i]);
        drawRoundedRect(ctx, fx + 22, 226, 40, 6, 3, '#94A3B8');
        drawRoundedRect(ctx, fx + 22, 238, 28, 6, 3, '#94A3B8');
    });
};

/**
 * 15. HÌNH ẢNH TRỰC QUAN MÀN HÌNH LẬP TRÌNH KÉO THẢ KHỐI LỆNH SCRATCH
 */
const drawScratchProgrammingScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F5F3FF');
    bgGrad.addColorStop(1, '#DDD6FE');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#7C3AED', 2);

    // Mặt bàn gỗ & Chân màn hình
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);
    drawRoundedRect(ctx, 352, 304, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 346, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Màn hình máy tính hiển thị giao diện Scratch
    drawRoundedRect(ctx, 64, 20, 632, 290, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 78, 34, 604, 258, 8, '#F8FAFC', '#CBD5E1', 1.5);
    drawRoundedRect(ctx, 78, 34, 604, 26, 6, '#7C3AED');

    // Vùng ghép các khối lệnh đầy màu sắc bên trái
    drawRoundedRect(ctx, 90, 68, 280, 212, 8, '#FFFFFF', '#DDD6FE', 1.5);
    const blockColors = ['#F59E0B', '#D97706', '#2563EB', '#2563EB', '#7C3AED'];
    blockColors.forEach((col, idx) => {
        const indent = idx === 2 || idx === 3 ? 22 : 0;
        drawRoundedRect(ctx, 110 + indent, 84 + idx * 36, 210 - indent, 30, 6, col, '#1E293B', 1);
        drawRoundedRect(ctx, 126 + indent, 95 + idx * 36, 120, 8, 4, '#FFFFFF');
    });

    // Sân khấu biểu diễn (Stage) và nhân vật chú mèo/robot bên phải
    drawRoundedRect(ctx, 382, 68, 286, 212, 8, '#FFFFFF', '#CBD5E1', 1.5);
    drawRoundedRect(ctx, 396, 82, 258, 184, 6, '#F0FDF4', '#86EFAC', 1.5);

    // Hình vuông quỹ đạo di chuyển của nhân vật trên sân khấu
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.strokeRect(436, 116, 112, 112);

    // Nhân vật hoạt hình trực quan trên sân khấu
    ctx.beginPath();
    ctx.arc(576, 174, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    ctx.strokeStyle = '#C2410C';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Đôi mắt nhân vật
    ctx.beginPath();
    ctx.arc(566, 168, 5, 0, Math.PI * 2);
    ctx.arc(586, 168, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
};

/**
 * 16. HÌNH ẢNH TRỰC QUAN MÀN HÌNH MÁY TÍNH HIỂN THỊ PHẦN MỀM SOẠN THẢO / TRÌNH CHIẾU / ĐỒ HỌA PAINT
 */
const drawOfficeOrPaintScene = (ctx: CanvasRenderingContext2D, subjectLower: string, _cleanDesc: string) => {
    const isPresentation =
        subjectLower.includes('phần mềm trình chiếu') ||
        subjectLower.includes('powerpoint') ||
        subjectLower.includes('trang chiếu') ||
        subjectLower.includes('bài trình chiếu');
    const isPaint =
        subjectLower.includes('paint') ||
        subjectLower.includes('phần mềm vẽ') ||
        subjectLower.includes('công cụ vẽ') ||
        subjectLower.includes('tô màu');

    const themeColor = isPresentation ? '#D97706' : isPaint ? '#EA580C' : '#2563EB';

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(1, '#E2E8F0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, themeColor, 2);

    // Mặt bàn gỗ & chân màn hình
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);
    drawRoundedRect(ctx, 352, 304, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 346, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Màn hình máy tính 3D
    drawRoundedRect(ctx, 64, 20, 632, 290, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 78, 34, 604, 258, 8, '#FFFFFF', '#CBD5E1', 1.5);
    drawRoundedRect(ctx, 78, 34, 604, 28, 6, themeColor);

    // Thanh công cụ trực quan (Ribbon)
    drawRoundedRect(ctx, 90, 68, 580, 32, 6, '#F1F5F9', '#CBD5E1', 1);
    const paletteColors = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'];
    paletteColors.forEach((col, idx) => {
        ctx.beginPath();
        ctx.arc(114 + idx * 24, 84, 8, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });

    // Trang giấy / Trang chiếu / Khung vẽ trực quan ở giữa màn hình
    drawRoundedRect(ctx, 114, 110, 532, 168, 8, '#FFFFFF', '#94A3B8', 1.5);
    if (isPaint) {
        // Bức tranh ngôi nhà, mặt trời và cây xanh đang vẽ trên Paint
        ctx.beginPath();
        ctx.arc(180, 148, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#FACC15';
        ctx.fill();

        drawRoundedRect(ctx, 310, 178, 110, 82, 4, '#FEF08A', '#CA8A04', 2);
        ctx.beginPath();
        ctx.moveTo(296, 178);
        ctx.lineTo(365, 130);
        ctx.lineTo(434, 178);
        ctx.closePath();
        ctx.fillStyle = '#EF4444';
        ctx.fill();

        drawRoundedRect(ctx, 510, 198, 20, 62, 3, '#78350F');
        ctx.beginPath();
        ctx.arc(520, 176, 32, 0, Math.PI * 2);
        ctx.fillStyle = '#22C55E';
        ctx.fill();
    } else {
        // Bố cục trang tài liệu / trang chiếu gồm dòng tiêu đề, các dòng văn bản và khung ảnh minh họa
        drawRoundedRect(ctx, 146, 130, 240, 16, 4, themeColor);
        drawRoundedRect(ctx, 146, 160, 260, 10, 4, '#64748B');
        drawRoundedRect(ctx, 146, 180, 240, 10, 4, '#94A3B8');
        drawRoundedRect(ctx, 146, 200, 250, 10, 4, '#94A3B8');
        drawRoundedRect(ctx, 146, 220, 190, 10, 4, '#94A3B8');

        drawRoundedRect(ctx, 436, 134, 176, 122, 8, '#E0F2FE', '#38BDF8', 1.5);
        ctx.beginPath();
        ctx.arc(474, 166, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#FACC15';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(436, 244);
        ctx.lineTo(488, 188);
        ctx.lineTo(540, 226);
        ctx.lineTo(576, 198);
        ctx.lineTo(612, 244);
        ctx.closePath();
        ctx.fillStyle = '#22C55E';
        ctx.fill();
    }
};

const normalizeImageDescKey = (rawDesc: string): string => {
    return (rawDesc || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
};

/**
 * 17. HÌNH ẢNH TRỰC QUAN MÀN HÌNH MÁY TÍNH ĐỐI CHIẾU & KIỂM TRA THÔNG TIN TƯ VẤN TỪ AI / CHATGPT
 * (Vẽ trực quan màn hình máy tính đặt trên bàn gỗ với cửa sổ hội thoại AI bên trái và cửa sổ tìm kiếm kiểm chứng bên phải, kèm kính lúp xác thực - tuyệt đối không vẽ mindmap hay infographic)
 */
const drawAiVerificationAndDigitalScreenScene = (
    ctx: CanvasRenderingContext2D,
    subjectLower: string
) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#EFF6FF');
    bgGrad.addColorStop(0.75, '#DBEAFE');
    bgGrad.addColorStop(1, '#BFDBFE');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#3B82F6', 2);

    // Mặt bàn gỗ phía dưới
    const tableGrad = ctx.createLinearGradient(0, 336, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(1, '#92400E');
    drawRoundedRect(ctx, 12, 338, 736, 68, 8, tableGrad, '#78350F', 1.5);

    // Chân đế màn hình máy tính 3D
    ctx.beginPath();
    ctx.ellipse(380, 366, 96, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fill();
    drawRoundedRect(ctx, 352, 306, 56, 48, 4, '#475569', '#1E293B', 2);
    drawRoundedRect(ctx, 296, 348, 168, 16, 8, '#64748B', '#1E293B', 2);

    // Khung màn hình máy tính hiện đại
    drawRoundedRect(ctx, 74, 24, 612, 288, 14, '#0F172A', '#334155', 3);
    drawRoundedRect(ctx, 88, 38, 584, 256, 8, '#F8FAFC', '#CBD5E1', 1.5);

    // Thanh tiêu đề cửa sổ trình duyệt
    drawRoundedRect(ctx, 88, 38, 584, 28, 6, '#E2E8F0');
    ['#EF4444', '#F59E0B', '#22C55E'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(106 + i * 15, 52, 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });
    drawRoundedRect(ctx, 162, 44, 492, 16, 8, '#FFFFFF', '#CBD5E1', 1);

    const isSearchFocus =
        subjectLower.includes('google') ||
        subjectLower.includes('tìm kiếm') ||
        subjectLower.includes('đối chiếu') ||
        subjectLower.includes('kiểm chứng') ||
        subjectLower.includes('trang web chính thống');

    // Cửa sổ bên trái: Giao diện Trợ lý AI / ChatGPT
    const leftW = isSearchFocus ? 256 : 284;
    drawRoundedRect(ctx, 102, 76, leftW, 204, 10, '#FFFFFF', '#10B981', 2);
    drawRoundedRect(ctx, 102, 76, leftW, 32, 8, '#10B981');

    // Icon Robot AI nhỏ trên thanh header
    ctx.beginPath();
    ctx.arc(124, 92, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI', 124, 95);

    // Bong bóng câu hỏi của người dùng
    drawRoundedRect(ctx, 146, 118, leftW - 56, 36, 8, '#DBEAFE', '#60A5FA', 1.2);
    drawRoundedRect(ctx, 158, 128, leftW - 84, 7, 3, '#2563EB');
    drawRoundedRect(ctx, 158, 140, leftW - 116, 7, 3, '#60A5FA');

    // Bong bóng câu trả lời tư vấn từ ChatGPT
    drawRoundedRect(ctx, 114, 164, leftW - 28, 72, 8, '#ECFDF5', '#34D399', 1.5);
    drawRoundedRect(ctx, 126, 176, leftW - 54, 7, 3, '#059669');
    drawRoundedRect(ctx, 126, 190, leftW - 64, 7, 3, '#10B981');
    drawRoundedRect(ctx, 126, 204, leftW - 88, 7, 3, '#10B981');
    drawNumberedCalloutCircle(ctx, '?', 114 + leftW - 44, 214, 13);

    // Thanh nhập câu hỏi dưới đáy khung chat
    drawRoundedRect(ctx, 114, 246, leftW - 24, 22, 11, '#F1F5F9', '#CBD5E1', 1);

    // Cửa sổ bên phải: Công cụ Tìm kiếm & Nguồn thông tin chính thống để kiểm tra, đối chiếu
    const rightX = 102 + leftW + 16;
    const rightW = 556 - leftW;
    drawRoundedRect(ctx, rightX, 76, rightW, 204, 10, '#FFFFFF', '#2563EB', 2);
    drawRoundedRect(ctx, rightX, 76, rightW, 32, 8, '#2563EB');

    // Ô tìm kiếm Google
    drawRoundedRect(ctx, rightX + 14, 118, rightW - 28, 28, 14, '#F8FAFC', '#3B82F6', 1.5);
    ctx.beginPath();
    ctx.arc(rightX + 30, 132, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawRoundedRect(ctx, rightX + 44, 128, rightW - 86, 8, 4, '#93C5FD');

    // Kết quả đối chiếu 1 (Có tích xanh xác thực)
    drawRoundedRect(ctx, rightX + 14, 156, rightW - 28, 50, 8, '#F0FDF4', '#22C55E', 1.5);
    drawRoundedRect(ctx, rightX + 26, 168, rightW - 90, 8, 4, '#15803D');
    drawRoundedRect(ctx, rightX + 26, 182, rightW - 110, 7, 3, '#86EFAC');
    ctx.beginPath();
    ctx.arc(rightX + rightW - 36, 181, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#16A34A';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓', rightX + rightW - 36, 182);

    // Kết quả đối chiếu 2 (Sách báo / Trang chính thống)
    drawRoundedRect(ctx, rightX + 14, 216, rightW - 28, 50, 8, '#EFF6FF', '#60A5FA', 1.5);
    drawRoundedRect(ctx, rightX + 26, 228, rightW - 90, 8, 4, '#1D4ED8');
    drawRoundedRect(ctx, rightX + 26, 242, rightW - 115, 7, 3, '#93C5FD');
    ctx.beginPath();
    ctx.arc(rightX + rightW - 36, 241, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('✓', rightX + rightW - 36, 242);

    // Kính lúp trực quan soi chiếu giữa 2 cửa sổ
    const magX = 102 + leftW + 8;
    const magY = 178;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(magX + 16, magY + 16);
    ctx.lineTo(magX + 38, magY + 38);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(magX, magY, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(254, 249, 195, 0.88)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();
    ctx.restore();
};

/**
 * 18. HÌNH ẢNH TRỰC QUAN VẬT THỂ / HỌC CỤ / MÀN HÌNH ĐỐI TƯỢNG TRÊN BÀN GỖ
 * (Tuyệt đối KHÔNG vẽ sơ đồ tư duy mindmap, KHÔNG vẽ infographic)
 */
const drawDirectVisualObjectFallback = (
    ctx: CanvasRenderingContext2D,
    subjectLower: string,
    _cleanDesc: string
) => {
    const isDigitalOrComputerTopic =
        subjectLower.includes('máy tính') ||
        subjectLower.includes('màn hình') ||
        subjectLower.includes('phần mềm') ||
        subjectLower.includes('ứng dụng') ||
        subjectLower.includes('trình duyệt') ||
        subjectLower.includes('internet') ||
        subjectLower.includes('mạng') ||
        subjectLower.includes('kĩ năng số') ||
        subjectLower.includes('kỹ năng số') ||
        subjectLower.includes('chatgpt') ||
        subjectLower.includes('trí tuệ nhân tạo') ||
        subjectLower.includes('thông tin');

    if (isDigitalOrComputerTopic) {
        drawAiVerificationAndDigitalScreenScene(ctx, subjectLower);
        return;
    }

    // Vẽ bối cảnh bàn gỗ thực hành trực quan với các vật mẫu / học cụ 3D đặt trên bàn
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0F9FF');
    bgGrad.addColorStop(0.7, '#E0F2FE');
    bgGrad.addColorStop(1, '#BAE6FD');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    // Mặt bàn gỗ thực hành
    const tableGrad = ctx.createLinearGradient(0, 295, 0, 412);
    tableGrad.addColorStop(0, '#D97706');
    tableGrad.addColorStop(0.5, '#B45309');
    tableGrad.addColorStop(1, '#78350F');
    drawRoundedRect(ctx, 12, 298, 736, 108, 8, tableGrad, '#78350F', 1.5);

    // Khay học cụ / vật mẫu thứ nhất (Bên trái)
    ctx.beginPath();
    ctx.ellipse(210, 336, 95, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    drawRoundedRect(ctx, 115, 145, 190, 185, 16, '#FFFFFF', '#0284C7', 2.5);
    drawRoundedRect(ctx, 133, 165, 154, 145, 12, '#E0F2FE', '#38BDF8', 1.8);

    // Vật thể 3D trực quan trong khay 1
    ctx.beginPath();
    ctx.arc(210, 236, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    drawRoundedRect(ctx, 182, 208, 56, 56, 10, '#38BDF8', '#0369A1', 2);

    // Mô hình / Học cụ chính ở trung tâm - bên phải
    ctx.beginPath();
    ctx.ellipse(515, 336, 125, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();
    drawRoundedRect(ctx, 380, 120, 270, 210, 18, '#FFFFFF', '#16A34A', 2.5);
    drawRoundedRect(ctx, 402, 142, 226, 164, 12, '#F0FDF4', '#4ADE80', 1.8);

    // Các khối chi tiết vật lý trực quan bên trong
    drawRoundedRect(ctx, 424, 174, 82, 104, 10, '#22C55E', '#15803D', 2);
    drawRoundedRect(ctx, 524, 174, 82, 48, 8, '#F59E0B', '#B45309', 2);
    drawRoundedRect(ctx, 524, 230, 82, 48, 8, '#3B82F6', '#1D4ED8', 2);
};

/**
 * Tạo hình ảnh trực quan (PNG Data URL) mô tả ĐÚNG ĐỐI TƯỢNG, HỌC CỤ, VẬT THẬT HOẶC MÀN HÌNH GIAO DIỆN
 * được nhắc đến ở câu văn ngay phía trên (`precedingContext`) và mô tả hình ảnh (`rawLine`).
 */
export const renderPedagogicalIllustrationDataUrl = (
    rawLine: string,
    lessonTitle: string = '',
    precedingContext: string = ''
): string => {
    const cleanDesc = extractCleanImageDescription(rawLine);
    const cleanContext = (precedingContext || '').trim();
    const contextLines = cleanContext.split('\n').map(l => l.trim()).filter(Boolean);
    const immediateContextLine = (contextLines.length > 0 ? contextLines[contextLines.length - 1] : cleanContext)
        .replace(/\*\*/g, '')
        .replace(/^[-–\*\s]+/, '')
        .trim();

    const descKey = `desc__${normalizeImageDescKey(cleanDesc)}`;
    const ctxKey = `ctx__${normalizeImageDescKey(`${immediateContextLine} ${cleanDesc}`)}`;
    const cacheKey = `${lessonTitle}__${immediateContextLine}__${cleanDesc}`;

    // Ưu tiên tuyệt đối: Lấy hình ảnh chụp trực quan do AI tạo ra từ `aiGeneratedImageCache`
    if (aiGeneratedImageCache.has(ctxKey)) {
        return aiGeneratedImageCache.get(ctxKey)!;
    }
    if (aiGeneratedImageCache.has(descKey)) {
        return aiGeneratedImageCache.get(descKey)!;
    }
    if (aiGeneratedImageCache.has(cacheKey)) {
        return aiGeneratedImageCache.get(cacheKey)!;
    }

    // Nếu chưa có ảnh AI, kiểm tra bộ nhớ đệm Canvas dự phòng
    if (canvasFallbackCache.has(cacheKey)) {
        return canvasFallbackCache.get(cacheKey)!;
    }

    if (typeof document === 'undefined') {
        return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const coreDescObject = extractCoreVisualObjectText(cleanDesc);
    const coreContextObject = extractCoreVisualObjectText(immediateContextLine);
    const subjectText = `${coreDescObject} ${coreContextObject}`.trim();
    const subjectLower = subjectText.toLowerCase();

    // 0. NHẬN DIỆN CHỦ ĐỀ CHATGPT / TRÍ TUỆ NHÂN TẠO / KIỂM TRA & ĐỐI CHIẾU THÔNG TIN SỐ
    const isAiOrFactCheckTopic =
        subjectLower.includes('chatgpt') ||
        subjectLower.includes('chat gpt') ||
        subjectLower.includes('trí tuệ nhân tạo') ||
        subjectLower.includes('kiểm tra thông tin') ||
        subjectLower.includes('thông tin tư vấn') ||
        subjectLower.includes('đối chiếu thông tin') ||
        subjectLower.includes('kiểm chứng');

    // 1. NHẬN DIỆN RÔ-BỐT & CÁC BỘ PHẬN CỦA RÔ-BỐT
    const isRobotTopic =
        !isAiOrFactCheckTopic &&
        (subjectLower.includes('rô-bốt') ||
            subjectLower.includes('rô bốt') ||
            subjectLower.includes('robot') ||
            (subjectLower.includes('cảm biến') && subjectLower.includes('bộ phận')));

    // 2. NHẬN DIỆN BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT
    const isAssemblyKitBox =
        subjectLower.includes('bộ lắp ghép') ||
        subjectLower.includes('hộp lắp ghép') ||
        subjectLower.includes('tua-vít') ||
        subjectLower.includes('tua vít') ||
        subjectLower.includes('cờ-lê') ||
        subjectLower.includes('cờ lê') ||
        (subjectLower.includes('chi tiết') && subjectLower.includes('dụng cụ')) ||
        (subjectLower.includes('thanh thẳng') && (subjectLower.includes('ốc vít') || subjectLower.includes('đai ốc') || subjectLower.includes('bánh răng')));

    // 3. NHẬN DIỆN MÔ HÌNH KỸ THUẬT ĐÃ LẮP GHÉP
    const isAssembledTechnicalModel =
        !isAssemblyKitBox &&
        (subjectLower.includes('mô hình xe') ||
            subjectLower.includes('xe cần cẩu') ||
            subjectLower.includes('cần cẩu') ||
            subjectLower.includes('xe tải') ||
            subjectLower.includes('xe nôi') ||
            subjectLower.includes('xích đu') ||
            subjectLower.includes('cầu vượt') ||
            subjectLower.includes('cối xay gió') ||
            subjectLower.includes('điện gió') ||
            subjectLower.includes('điện mặt trời') ||
            subjectLower.includes('năng lượng mặt trời') ||
            subjectLower.includes('mô hình kĩ thuật') ||
            subjectLower.includes('mô hình kỹ thuật'));

    // 4. NHẬN DIỆN ĐÈN HỌC / ĐỒ DÙNG ĐIỆN / MẠCH ĐIỆN
    const isElectricalOrLamp =
        subjectLower.includes('đèn học') ||
        subjectLower.includes('bóng đèn') ||
        subjectLower.includes('chụp đèn') ||
        subjectLower.includes('mạch điện') ||
        subjectLower.includes('quạt điện') ||
        subjectLower.includes('máy thu thanh') ||
        subjectLower.includes('máy thu hình');

    // 5. NHẬN DIỆN CHẬU HOA / CÂY CẢNH / GIÁ THỂ / GIEO HẠT
    const isPlantOrGardening =
        subjectLower.includes('chậu hoa') ||
        subjectLower.includes('chậu trồng') ||
        subjectLower.includes('loại chậu') ||
        subjectLower.includes('chậu đất nung') ||
        subjectLower.includes('chậu nhựa') ||
        subjectLower.includes('chậu sứ') ||
        subjectLower.includes('cây cảnh') ||
        subjectLower.includes('giá thể') ||
        subjectLower.includes('xơ dừa') ||
        subjectLower.includes('trấu hun') ||
        subjectLower.includes('mùn cưa') ||
        subjectLower.includes('gieo hạt') ||
        subjectLower.includes('trồng cây') ||
        subjectLower.includes('trồng hoa');

    // 6. NHẬN DIỆN CÁC DẠNG THÔNG TIN TRÊN TRANG WEB
    const infoTypeCount = [
        subjectLower.includes('chữ viết') || subjectLower.includes('văn bản'),
        subjectLower.includes('hình ảnh'),
        subjectLower.includes('âm thanh'),
        subjectLower.includes('video')
    ].filter(Boolean).length;

    const isWebpageMultimediaTopic =
        !isAiOrFactCheckTopic &&
        ((subjectLower.includes('trang web') && infoTypeCount >= 2) ||
            subjectLower.includes('siêu văn bản') ||
            subjectLower.includes('siêu liên kết') ||
            /hình\s*7\b/i.test(subjectLower));

    // 7. NHẬN DIỆN 4 DẠNG THÔNG TIN ĐA PHƯƠNG TIỆN
    const isMultimediaInformationTypes =
        !isAiOrFactCheckTopic &&
        (subjectLower.includes('các loại thông tin') ||
            subjectLower.includes('các dạng thông tin') ||
            infoTypeCount >= 3);

    // 8. NHẬN DIỆN CỔNG KẾT NỐI & KHẮC PHỤC SỰ CỐ MÁY TÍNH
    const isPortsOrTroubleshooting =
        subjectLower.includes('cổng kết nối') ||
        subjectLower.includes('khắc phục sự cố') ||
        subjectLower.includes('lỗi không nhận');

    // 9. NHẬN DIỆN THIẾT BỊ PHẦN CỨNG / PHẦN MỀM CỤ THỂ
    const matchedCatalogItems = SPECIFIC_HARDWARE_SOFTWARE_CATALOG
        .map(item => {
            let firstPos = Infinity;
            for (const kw of item.keywords) {
                const idx = subjectLower.indexOf(kw);
                if (idx !== -1 && idx < firstPos) {
                    firstPos = idx;
                }
            }
            return { item, pos: firstPos };
        })
        .filter(entry => entry.pos !== Infinity)
        .sort((a, b) => a.pos - b.pos)
        .map(entry => entry.item);

    const hasSpecificNamedItems =
        !isAiOrFactCheckTopic &&
        (matchedCatalogItems.length >= 2 ||
            matchedCatalogItems.some(it => ['printer', 'hdd', 'typing_app', 'usb_drive', 'speaker'].includes(it.id)));

    if (isPlantOrGardening) {
        drawPlantAndGardeningScene(ctx, subjectLower);
    } else if (isAiOrFactCheckTopic) {
        drawAiVerificationAndDigitalScreenScene(ctx, subjectLower);
    } else if (isRobotTopic) {
        drawRobotAnatomyScene(ctx);
    } else if (isAssemblyKitBox) {
        drawTechnicalAssemblyKitScene(ctx);
    } else if (isAssembledTechnicalModel) {
        drawAssembledTechnicalModelScene(ctx, subjectLower, cleanDesc);
    } else if (isElectricalOrLamp) {
        drawElectricalApplianceOrLampScene(ctx);
    } else if (
        subjectLower.includes('máy tìm kiếm') ||
        subjectLower.includes('từ khóa tìm kiếm') ||
        subjectLower.includes('ô tìm kiếm') ||
        subjectLower.includes('google tìm kiếm') ||
        subjectLower.includes('google search') ||
        (subjectLower.includes('tìm kiếm') && (subjectLower.includes('internet') || subjectLower.includes('trình duyệt')))
    ) {
        drawSearchEngineScene(ctx, subjectText);
    } else if (isWebpageMultimediaTopic) {
        drawWebpageInformationScene(ctx, subjectText, subjectLower);
    } else if (isMultimediaInformationTypes) {
        drawMultimediaTypesOnScreenScene(ctx);
    } else if (isPortsOrTroubleshooting) {
        drawConnectionPortsAndTroubleshootingScene(ctx);
    } else if (hasSpecificNamedItems) {
        const isClassify = /phân\s*loại|đâu\s*là\s*phần\s*cứng|bài\s*tập/i.test(subjectLower);
        drawSpecificItemsCardsScene(ctx, matchedCatalogItems, isClassify);
    } else if (
        subjectLower.includes('hàng phím') ||
        subjectLower.includes('gõ bàn phím') ||
        subjectLower.includes('đặt tay') ||
        subjectLower.includes('phím f') ||
        subjectLower.includes('tư thế ngồi')
    ) {
        drawKeyboardErgonomicsScene(ctx);
    } else if (
        subjectLower.includes('an toàn') ||
        subjectLower.includes('bảo mật') ||
        subjectLower.includes('mật khẩu') ||
        subjectLower.includes('thông tin cá nhân') ||
        subjectLower.includes('bản quyền') ||
        subjectLower.includes('quyền tác giả')
    ) {
        drawDigitalSafetyScene(ctx);
    } else if (
        subjectLower.includes('thư mục') ||
        subjectLower.includes('cây thư mục') ||
        (subjectLower.includes('tệp') && !subjectLower.includes('đính kèm'))
    ) {
        drawFileFolderScene(ctx);
    } else if (
        subjectLower.includes('scratch') ||
        subjectLower.includes('lập trình') ||
        subjectLower.includes('khối lệnh') ||
        subjectLower.includes('sân khấu') ||
        subjectLower.includes('thuật toán')
    ) {
        drawScratchProgrammingScene(ctx);
    } else if (
        subjectLower.includes('phần cứng') ||
        subjectLower.includes('bộ phận của máy tính') ||
        subjectLower.includes('bộ phận chính của máy tính') ||
        subjectLower.includes('linh kiện máy tính') ||
        subjectLower.includes('máy tính để bàn')
    ) {
        drawHardwareSoftwareOverviewScene(ctx);
    } else if (
        subjectLower.includes('phần mềm soạn thảo') ||
        subjectLower.includes('microsoft word') ||
        subjectLower.includes('phần mềm trình chiếu') ||
        subjectLower.includes('powerpoint') ||
        subjectLower.includes('trang chiếu') ||
        subjectLower.includes('bài trình chiếu') ||
        subjectLower.includes('phần mềm vẽ') ||
        subjectLower.includes('paint')
    ) {
        drawOfficeOrPaintScene(ctx, subjectLower, cleanDesc);
    } else {
        drawDirectVisualObjectFallback(ctx, subjectLower, cleanDesc);
    }

    const dataUrl = canvas.toDataURL('image/png');
    canvasFallbackCache.set(cacheKey, dataUrl);
    return dataUrl;
};

/**
 * Chuẩn hóa mọi định dạng ảnh AI (JPEG / WebP / PNG) về chuẩn PNG 16:9 sắc nét
 * để cả trình duyệt và Microsoft Word (.docx ImageRun) đều hiển thị 100% không lỗi.
 */
const normalizeAiImageToPngDataUrl = (base64Data: string, mimeType: string): Promise<string> => {
    const rawDataUrl = `data:${mimeType || 'image/png'};base64,${base64Data}`;
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
        return Promise.resolve(rawDataUrl);
    }
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const targetW = 800;
                const targetH = Math.round(((img.height || 450) / (img.width || 800)) * targetW) || 450;
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, targetW, targetH);
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                    resolve(canvas.toDataURL('image/png'));
                    return;
                }
            } catch {
                // fallback
            }
            resolve(rawDataUrl);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
    });
};

const buildAiImagePromptForLessonContext = (
    cleanDesc: string,
    immediatePrecedingLine: string,
    lessonTitle: string
): string => {
    const coreDesc = extractCoreVisualObjectText(cleanDesc);
    const coreImmediate = extractCoreVisualObjectText(immediatePrecedingLine);

    return `Tạo một bức ảnh chụp thực tế chuẩn sư phạm (photorealistic studio educational photograph, tỷ lệ ngang 16:9) sắc nét, chân thực, đặt trên mặt bàn gỗ sáng màu, minh họa CHÍNH XÁC 100% đối tượng/vật thể/học cụ/màn hình giao diện của bài học "${lessonTitle}":
- Nội dung câu lệnh của giáo viên ngay phía trên: "${immediatePrecedingLine || coreImmediate || coreDesc}"
- Mô tả chi tiết hình ảnh cần tạo: "${coreDesc}"

NGUYÊN TẮC BẮT BUỘC TUYỆT ĐỐI:
1. Hình ảnh phải thể hiện trực tiếp VẬT THẬT / HỌC CỤ THẬT / CÁC BỘ PHẬN LINH KIỆN THẬT / MÔ HÌNH THẬT hoặc MÀN HÌNH MÁY TÍNH HIỂN THỊ ĐÚNG GIAO DIỆN vừa được nhắc đến ở câu văn ngay phía trên, đặt trên mặt bàn gỗ sáng màu với ánh sáng studio rõ nét.
2. Nếu câu văn yêu cầu quan sát các bộ phận cấu tạo hoặc phân loại nhiều vật mẫu (ví dụ: các bộ phận của máy tính, các bộ phận của rô-bốt, các loại chậu trồng cây, các loại giá thể, bộ lắp ghép kỹ thuật...), hãy bày trí đầy đủ các vật thật/bộ phận thật ngay ngắn trên mặt bàn gỗ và gắn nhãn tên tiếng Việt ngắn gọn, rõ ràng chỉ trực tiếp vào từng bộ phận/vật thật đó.
3. Nếu câu văn yêu cầu quan sát trang web, cửa sổ ChatGPT, công cụ tìm kiếm hoặc phần mềm trên máy tính, hãy chụp cận cảnh màn hình máy tính đặt trên bàn gỗ đang hiển thị trực quan đúng giao diện đó.
4. NGHIÊM CẤM TUYỆT ĐỐI: KHÔNG vẽ sơ đồ tư duy (mindmap), KHÔNG vẽ đồ họa thông tin chia ô chữ (infographic), KHÔNG vẽ lưu đồ khối, KHÔNG vẽ phiếu học tập, KHÔNG vẽ cảnh lớp học chung chung.`;
};

/**
 * Tự động gọi AI tạo hình ảnh trực quan thực tế (photorealistic tabletop object / interface illustration)
 * bám sát 100% câu văn ngay phía trên và lưu vào `aiGeneratedImageCache`
 * để hiển thị đồng nhất trên giao diện Xem trước và khi xuất file Word (.docx).
 */
export const pregenerateLessonImagesWithAI = async (
    plan: LessonPlanResponse,
    arg2: string = '',
    arg3: string = '',
    arg4?: string
): Promise<void> => {
    if (!plan || !Array.isArray(plan.periods)) return;

    const looksLikeApiKey = (val?: string) =>
        Boolean(val && /^AIza[0-9A-Za-z_-]{20,}$/.test(val.trim()));

    const envKey =
        (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) ||
        ((import.meta as any).env && ((import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY)) ||
        '';

    let resolvedApiKey = '';
    if (looksLikeApiKey(arg4)) {
        resolvedApiKey = arg4!.trim();
    } else if (looksLikeApiKey(arg2)) {
        resolvedApiKey = arg2.trim();
    } else if (looksLikeApiKey(envKey)) {
        resolvedApiKey = envKey.trim();
    } else if (arg4 && arg4.trim().length > 15 && /^[\x20-\x7E]+$/.test(arg4.trim())) {
        resolvedApiKey = arg4.trim();
    } else if (arg2 && arg2.trim().length > 15 && /^[\x20-\x7E]+$/.test(arg2.trim())) {
        resolvedApiKey = arg2.trim();
    } else if (envKey && envKey.trim().length > 10) {
        resolvedApiKey = envKey.trim();
    }

    if (!resolvedApiKey) return;

    const lessonTitleFallback = arg4 !== undefined ? `${arg2} ${arg3}`.trim() : arg3;

    const tasks: Array<{ descKey: string; ctxKey: string; cacheKey: string; prompt: string }> = [];
    const seenKeys = new Set<string>();

    for (const period of plan.periods) {
        const lessonTitle = plan.lesson_full_title || lessonTitleFallback || '';
        for (const act of period.activities || []) {
            for (const row of act.rows || []) {
                const rawTeacher = (row.teacher || '')
                    .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:|\[Hình ảnh minh họa:|Hình ảnh minh họa:)/gi, '\n$1')
                    .replace(/(\[Tích hợp[^\]]*\]:|-?\s*Tích hợp\s+[^:\n]+:)/gi, '\n$1');

                const lines = rawTeacher.split('\n').map(l => l.trim()).filter(Boolean);
                let immediatePrecedingLine = '';
                for (const line of lines) {
                    if (isImageHintLine(line)) {
                        const cleanDesc = extractCleanImageDescription(line);
                        const descKey = `desc__${normalizeImageDescKey(cleanDesc)}`;
                        const ctxKey = `ctx__${normalizeImageDescKey(`${immediatePrecedingLine} ${cleanDesc}`)}`;
                        const cacheKey = `${lessonTitle}__${immediatePrecedingLine}__${cleanDesc}`;

                        if (!seenKeys.has(ctxKey) && !aiGeneratedImageCache.has(ctxKey) && !aiGeneratedImageCache.has(descKey)) {
                            seenKeys.add(ctxKey);
                            tasks.push({
                                descKey,
                                ctxKey,
                                cacheKey,
                                prompt: buildAiImagePromptForLessonContext(cleanDesc, immediatePrecedingLine, lessonTitle)
                            });
                        }
                    } else if (!/^[-–\*\s]*(\[?\s*Tích\s*hợp\b)/i.test(line)) {
                        immediatePrecedingLine = line.replace(/\*\*/g, '').replace(/^[-–\*\s]+/, '').trim();
                    }
                }
            }
        }
    }

    if (tasks.length === 0) return;

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
    const baseImageModels = [
        'gemini-3.1-flash-lite-image',
        'gemini-2.5-flash-image',
        'gemini-nano-banana-2.1',
        'gemini-3.1-flash-image-preview',
        'gemini-3-pro-image'
    ];
    const imageModels = preferredImageModel
        ? [preferredImageModel, ...baseImageModels.filter(m => m !== preferredImageModel)]
        : baseImageModels;

    await Promise.all(
        tasks.slice(0, 6).map(async (task, taskIdx) => {
            if (taskIdx > 0) {
                await new Promise(r => setTimeout(r, taskIdx * 250));
            }
            for (const modelName of imageModels) {
                try {
                    const res = await Promise.race([
                        ai.models.generateContent({
                            model: modelName,
                            contents: {
                                parts: [{ text: task.prompt }]
                            }
                        }),
                        new Promise<null>(resolve => setTimeout(() => resolve(null), 20000))
                    ]);
                    if (!res) continue;
                    const parts = (res as any)?.candidates?.[0]?.content?.parts || [];
                    let foundImage = false;
                    for (const part of parts) {
                        if (part?.inlineData?.data && part?.inlineData?.mimeType?.startsWith('image/')) {
                            preferredImageModel = modelName;
                            const pngDataUrl = await normalizeAiImageToPngDataUrl(
                                part.inlineData.data,
                                part.inlineData.mimeType
                            );
                            aiGeneratedImageCache.set(task.ctxKey, pngDataUrl);
                            aiGeneratedImageCache.set(task.descKey, pngDataUrl);
                            aiGeneratedImageCache.set(task.cacheKey, pngDataUrl);
                            notifyImageListeners();
                            foundImage = true;
                            break;
                        }
                    }
                    if (foundImage) break;
                } catch {
                    // Thử tiếp model ảnh kế tiếp trong danh sách
                }
            }
        })
    );
};


