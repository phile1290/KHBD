/**
 * Hệ thống Tạo & Xuất bản Hình ảnh Trực quan Học cụ / Mô hình Kỹ thuật / Đối tượng Bài học
 * - Trực tiếp tạo và hiển thị hình ảnh mô phỏng chính xác đối tượng, học cụ hoặc mô hình kỹ thuật
 *   được nhắc đến ở câu văn ngay phía trên (`precedingContext`) và dòng mô tả (`rawLine`).
 * - TUYỆT ĐỐI KHÔNG vẽ khung giao diện phiếu học tập ("Thành phần quan sát 1/2", "Nội dung hoạt động..."),
 *   KHÔNG vẽ cảnh lớp học chung chung, KHÔNG vẽ nhầm sang giao diện PowerPoint khi câu lệnh có từ "Giáo viên trình chiếu...".
 */

import { GoogleGenAI } from "@google/genai";
import { LessonPlanResponse } from "../types";

const imageDataUrlCache = new Map<string, string>();

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
 * 1. HÌNH ẢNH BÓC TÁCH CHI TIẾT CẤU TẠO CÁC BỘ PHẬN CỦA RÔ-BỐT (ROBOT ANATOMY BREAKDOWN)
 * Khớp chuẩn mực với yêu cầu: "Giáo viên trình chiếu hình ảnh phân tích/phân tách các bộ phận của robot"
 */
const drawRobotAnatomyScene = (ctx: CanvasRenderingContext2D) => {
    // Nền studio kỹ thuật hiện đại
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F1F5F9');
    bgGrad.addColorStop(0.75, '#E2E8F0');
    bgGrad.addColorStop(1, '#CBD5E1');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#94A3B8', 2);

    // Lưới kỹ thuật mờ phía sau
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 740; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.lineTo(x, 400);
        ctx.stroke();
    }
    for (let y = 20; y < 400; y += 35) {
        ctx.beginPath();
        ctx.moveTo(12, y);
        ctx.lineTo(748, y);
        ctx.stroke();
    }
    ctx.restore();

    // Bệ đứng 3D của Rô-bốt
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(380, 384, 125, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#94A3B8';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(380, 380, 108, 17, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const cx = 380;

    // --- 1. ĐẦU RÔ-BỐT & HỆ THỐNG CẢM BIẾN (SENSES) ---
    // Ăng-ten thu phát tín hiệu
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 28, 56);
    ctx.lineTo(cx - 34, 34);
    ctx.moveTo(cx + 28, 56);
    ctx.lineTo(cx + 34, 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 34, 32, 5, 0, Math.PI * 2);
    ctx.arc(cx + 34, 32, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0EA5E9';
    ctx.fill();

    // Khối hộp sọ cơ khí
    const headGrad = ctx.createLinearGradient(cx - 46, 52, cx + 46, 114);
    headGrad.addColorStop(0, '#FFFFFF');
    headGrad.addColorStop(0.5, '#E2E8F0');
    headGrad.addColorStop(1, '#94A3B8');
    drawRoundedRect(ctx, cx - 46, 52, 92, 62, 16, headGrad, '#334155', 2.2);

    // Kính che mặt cảm biến quang học
    drawRoundedRect(ctx, cx - 36, 64, 72, 32, 10, '#0F172A', '#0284C7', 1.8);

    // Hai mắt camera & cảm biến siêu âm
    [-16, 16].forEach(offsetX => {
        ctx.beginPath();
        ctx.arc(cx + offsetX, 80, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0284C7';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + offsetX, 80, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + offsetX - 2, 78, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
    });

    // Dải đèn cảm biến âm thanh ở miệng
    drawRoundedRect(ctx, cx - 18, 101, 36, 6, 3, '#38BDF8');

    // Khớp cổ cơ khí
    drawRoundedRect(ctx, cx - 16, 114, 32, 14, 4, '#64748B', '#334155', 1.8);

    // --- 2. THÂN RÔ-BỐT (KHUNG CƠ KHÍ + BỘ ĐIỀU KHIỂN + NGUỒN ĐIỆN BÓC TÁCH) ---
    const torsoGrad = ctx.createLinearGradient(cx - 64, 128, cx + 64, 250);
    torsoGrad.addColorStop(0, '#F8FAFC');
    torsoGrad.addColorStop(0.6, '#CBD5E1');
    torsoGrad.addColorStop(1, '#94A3B8');
    drawRoundedRect(ctx, cx - 64, 128, 128, 122, 18, torsoGrad, '#334155', 2.4);

    // Khoang bóc tách bên trong ngực: BỘ ĐIỀU KHIỂN (CONTROLLER) ở trên
    drawRoundedRect(ctx, cx - 46, 140, 92, 50, 8, '#0F172A', '#0EA5E9', 2);
    // Vi mạch & Chip CPU phát sáng
    drawRoundedRect(ctx, cx - 18, 151, 36, 28, 4, '#0284C7', '#38BDF8', 1.5);
    ctx.fillStyle = '#E0F2FE';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CPU / AI', cx, 166);
    // Đường mạch điện tử
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.3;
    [-34, -26, 26, 34].forEach(px => {
        ctx.beginPath();
        ctx.moveTo(cx + px, 148);
        ctx.lineTo(cx + px, 182);
        ctx.stroke();
    });

    // Khoang bóc tách phía dưới bụng: NGUỒN ĐIỆN / PIN (POWER)
    drawRoundedRect(ctx, cx - 44, 198, 88, 38, 6, '#1E293B', '#F59E0B', 1.8);
    // Các cell pin năng lượng
    [-26, -8, 10, 28].forEach(bx => {
        drawRoundedRect(ctx, cx + bx - 6, 205, 12, 24, 3, '#22C55E', '#86EFAC', 1);
    });

    // --- 3. CÁNH TAY & BỘ PHẬN CHẤP HÀNH (ACTUATORS & END EFFECTORS) ---
    // Khớp vai trái & phải (Động cơ Servo)
    [-76, 60].forEach(sx => {
        drawRoundedRect(ctx, cx + sx, 134, 16, 28, 6, '#0284C7', '#1E3A8A', 1.8);
    });

    // Cánh tay trái bóc tách khớp truyền động
    drawRoundedRect(ctx, cx - 102, 140, 26, 56, 10, '#E2E8F0', '#334155', 2);
    ctx.beginPath();
    ctx.arc(cx - 89, 202, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B'; // Khớp khuỷu tay truyền động
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    drawRoundedRect(ctx, cx - 101, 212, 24, 46, 8, '#CBD5E1', '#334155', 2);

    // Kẹp gắp cơ khí bên trái (End Effector)
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 95, 258);
    ctx.lineTo(cx - 105, 276);
    ctx.lineTo(cx - 96, 286);
    ctx.moveTo(cx - 83, 258);
    ctx.lineTo(cx - 73, 276);
    ctx.lineTo(cx - 82, 286);
    ctx.stroke();

    // Cánh tay phải
    drawRoundedRect(ctx, cx + 76, 140, 26, 56, 10, '#E2E8F0', '#334155', 2);
    ctx.beginPath();
    ctx.arc(cx + 89, 202, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    drawRoundedRect(ctx, cx + 77, 212, 24, 46, 8, '#CBD5E1', '#334155', 2);

    // Bàn tay kẹp cơ khí bên phải
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx + 83, 258);
    ctx.lineTo(cx + 73, 276);
    ctx.lineTo(cx + 82, 286);
    ctx.moveTo(cx + 95, 258);
    ctx.lineTo(cx + 105, 276);
    ctx.lineTo(cx + 96, 286);
    ctx.stroke();

    // --- 4. CHÂN & BÁNH XE DI CHUYỂN (LOCOMOTION) ---
    // Khớp hông
    drawRoundedRect(ctx, cx - 48, 250, 96, 18, 6, '#475569', '#1E293B', 2);

    // Hai chân cơ khí kết hợp bánh xe di chuyển
    [-32, 32].forEach(lx => {
        drawRoundedRect(ctx, cx + lx - 16, 268, 32, 68, 8, '#E2E8F0', '#334155', 2);
        // Lò xo giảm xóc & mô-tơ chân
        drawRoundedRect(ctx, cx + lx - 10, 284, 20, 34, 4, '#0284C7', '#1E3A8A', 1.4);
        // Đế bàn chân & bánh xe lăn
        drawRoundedRect(ctx, cx + lx - 22, 336, 44, 24, 8, '#334155', '#0F172A', 2);
        ctx.beginPath();
        ctx.arc(cx + lx - 14, 358, 9, 0, Math.PI * 2);
        ctx.arc(cx + lx + 14, 358, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // --- 5. HỆ THỐNG NHÃN CHỈ DẪN BÓC TÁCH CÁC BỘ PHẬN CỦA RÔ-BỐT ---
    // Bên trái:
    drawTechnicalCallout(
        ctx,
        cx - 38,
        78,
        242,
        66,
        '1. Đầu & Hệ thống cảm biến',
        'Camera, cảm biến nhận biết môi trường',
        'right',
        '#0284C7'
    );
    drawTechnicalCallout(
        ctx,
        cx - 89,
        166,
        242,
        142,
        '2. Khung cơ khí & Cánh tay',
        'Nâng đỡ và định hình cấu trúc rô-bốt',
        'right',
        '#2563EB'
    );
    drawTechnicalCallout(
        ctx,
        cx - 89,
        202,
        242,
        216,
        '3. Hệ thống truyền động',
        'Động cơ, khớp xoay giúp rô-bốt cử động',
        'right',
        '#D97706'
    );
    drawTechnicalCallout(
        ctx,
        cx - 90,
        276,
        242,
        292,
        '4. Bộ phận chấp hành (Tay kẹp)',
        'Cầm, nắm và thao tác với đồ vật',
        'right',
        '#0D9488'
    );

    // Bên phải:
    drawTechnicalCallout(
        ctx,
        cx + 30,
        164,
        518,
        104,
        '5. Bộ điều khiển (Não bộ)',
        'Vi mạch xử lý thông tin và điều khiển',
        'left',
        '#0284C7'
    );
    drawTechnicalCallout(
        ctx,
        cx + 30,
        216,
        518,
        196,
        '6. Nguồn điện (Pin / Ắc-quy)',
        'Cung cấp năng lượng cho rô-bốt hoạt động',
        'left',
        '#16A34A'
    );
    drawTechnicalCallout(
        ctx,
        cx + 46,
        348,
        518,
        312,
        '7. Bộ phận di chuyển',
        'Chân máy và bánh xe giúp rô-bốt đi lại',
        'left',
        '#4F46E5'
    );
};

/**
 * 2. HÌNH ẢNH CẬN CẢNH BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT TIỂU HỌC
 * Khớp chuẩn mực với yêu cầu: "Giáo viên yêu cầu các nhóm mở bộ lắp ghép mô hình kỹ thuật"
 */
const drawTechnicalAssemblyKitScene = (ctx: CanvasRenderingContext2D) => {
    // Mặt bàn gỗ ấm áp thực tế
    const woodGrad = ctx.createLinearGradient(0, 0, 760, 420);
    woodGrad.addColorStop(0, '#E7CBA9');
    woodGrad.addColorStop(0.5, '#DEB887');
    woodGrad.addColorStop(1, '#CFA36E');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, woodGrad, '#8B5A2B', 2);

    // Vân gỗ nhẹ
    ctx.strokeStyle = 'rgba(120, 63, 4, 0.12)';
    ctx.lineWidth = 1.5;
    for (let y = 28; y < 405; y += 34) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.bezierCurveTo(240, y - 8, 520, y + 8, 750, y - 3);
        ctx.stroke();
    }

    // --- HỘP NHỰA CHIA NGĂN ĐỰNG BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT (BÊN TRÁI & GIỮA) ---
    // Bóng đổ hộp
    drawRoundedRect(ctx, 32, 34, 496, 328, 14, 'rgba(15, 23, 42, 0.22)');
    // Vỏ hộp nhựa xanh/trắng
    drawRoundedRect(ctx, 26, 26, 492, 324, 12, '#F8FAFC', '#0284C7', 3);
    // Viền chia ngăn bên trong hộp
    drawRoundedRect(ctx, 36, 36, 472, 304, 8, '#E2E8F0', '#64748B', 2);

    // NGĂN 1 (Trái trên): Các thanh thẳng, thanh chữ U, thanh chữ L có lỗ (Perforated Beams)
    drawRoundedRect(ctx, 44, 44, 224, 140, 6, '#FFFFFF', '#94A3B8', 1.5);
    const beamColors = [
        { y: 58, w: 196, col: '#2563EB', holes: 9 },
        { y: 84, w: 172, col: '#16A34A', holes: 8 },
        { y: 110, w: 196, col: '#DC2626', holes: 9 },
        { y: 136, w: 148, col: '#F59E0B', holes: 7 }
    ];
    beamColors.forEach(b => {
        drawRoundedRect(ctx, 56, b.y, b.w, 18, 5, b.col, '#1E293B', 1.2);
        for (let i = 0; i < b.holes; i++) {
            ctx.beginPath();
            ctx.arc(68 + i * 21, b.y + 9, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#F8FAFC';
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
    drawBadgeLabel(ctx, 'Thanh thẳng • Thanh chữ U, L', 156, 171, '#EFF6FF', '#2563EB', '#1E3A8A');

    // NGĂN 2 (Giữa trên): Bánh răng, bánh xe, ròng rọc (Gears, Wheels, Pulleys)
    drawRoundedRect(ctx, 276, 44, 224, 140, 6, '#FFFFFF', '#94A3B8', 1.5);
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
    drawGear(322, 92, 24, '#EF4444');
    drawGear(382, 86, 19, '#F59E0B');
    drawGear(358, 130, 17, '#3B82F6');

    // Bánh xe cao su & vành nhựa
    [
        { x: 446, y: 82, r: 24 },
        { x: 454, y: 132, r: 20 }
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
    drawBadgeLabel(ctx, 'Bánh xe • Bánh răng • Ròng rọc', 388, 171, '#FEF3C7', '#D97706', '#92400E');

    // NGĂN 3 (Trái dưới): Ốc vít, đai ốc, vòng đệm, trục thép (Screws, Nuts, Axles)
    drawRoundedRect(ctx, 44, 192, 146, 140, 6, '#FFFFFF', '#94A3B8', 1.5);
    // Vẽ các ốc vít và đai ốc kim loại
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const sx = 68 + c * 38;
            const sy = 216 + r * 30;
            // Thân vít
            drawRoundedRect(ctx, sx - 8, sy - 4, 18, 7, 2, '#94A3B8', '#475569', 1);
            // Mũ vít
            drawRoundedRect(ctx, sx - 12, sy - 7, 6, 13, 2, '#64748B', '#334155', 1);
            // Đai ốc lục giác
            ctx.beginPath();
            ctx.arc(sx + 16, sy, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = '#CBD5E1';
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }
    drawBadgeLabel(ctx, 'Ốc vít • Đai ốc • Trục', 117, 316, '#F1F5F9', '#475569', '#0F172A');

    // NGĂN 4 (Giữa dưới): Tấm lớn, tấm nhỏ, hộp pin & động cơ mini
    drawRoundedRect(ctx, 198, 192, 146, 140, 6, '#FFFFFF', '#94A3B8', 1.5);
    // Tấm nền có lỗ
    drawRoundedRect(ctx, 212, 204, 118, 66, 6, '#22C55E', '#15803D', 1.5);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
            ctx.beginPath();
            ctx.arc(228 + c * 21, 218 + r * 19, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
    }
    // Mô-tơ / Hộp điều khiển nhỏ
    drawRoundedRect(ctx, 224, 276, 94, 24, 5, '#0284C7', '#1E3A8A', 1.2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MÔ-TƠ & HỘP PIN', 271, 288);
    drawBadgeLabel(ctx, 'Tấm nền • Động cơ', 271, 316, '#DCFCE7', '#16A34A', '#14532D');

    // NGĂN 5 (Phải dưới trong hộp): Tua-vít (Screwdriver) và Cờ-lê (Wrench)
    drawRoundedRect(ctx, 352, 192, 148, 140, 6, '#FFFFFF', '#94A3B8', 1.5);
    // Tua-vít cán đỏ
    drawRoundedRect(ctx, 368, 214, 54, 18, 7, '#DC2626', '#991B1B', 1.5);
    drawRoundedRect(ctx, 422, 220, 60, 6, 2, '#94A3B8', '#475569', 1.2);
    // Cờ-lê thép
    drawRoundedRect(ctx, 378, 260, 96, 12, 5, '#CBD5E1', '#475569', 1.5);
    ctx.beginPath();
    ctx.arc(376, 266, 12, 0.4, Math.PI * 2 - 0.4);
    ctx.arc(476, 266, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawBadgeLabel(ctx, 'Tua-vít & Cờ-lê', 426, 316, '#FEE2E2', '#DC2626', '#991B1B');

    // --- SÁCH HƯỚNG DẪN LẮP GHÉP & CHI TIẾT ĐANG THỰC HÀNH (BÊN PHẢI HỘP) ---
    drawRoundedRect(ctx, 536, 36, 202, 220, 8, '#FFFFFF', '#475569', 2);
    drawRoundedRect(ctx, 546, 46, 182, 28, 5, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BẢN HƯỚNG DẪN LẮP GHÉP', 637, 60);

    // Hình minh họa các bước trong tờ hướng dẫn
    drawRoundedRect(ctx, 554, 84, 166, 74, 6, '#F0F9FF', '#38BDF8', 1.2);
    // Vẽ sơ đồ lắp bánh xe vào thanh thẳng
    drawRoundedRect(ctx, 572, 108, 86, 14, 4, '#2563EB', '#1E3A8A', 1);
    ctx.beginPath();
    ctx.arc(678, 115, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Bước 1: Chọn chi tiết & dụng cụ', 637, 146);

    drawRoundedRect(ctx, 554, 168, 166, 74, 6, '#F0FDF4', '#4ADE80', 1.2);
    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 11.5px "Times New Roman", Arial';
    ctx.fillText('Bước 2: Lắp ghép từng bộ phận', 637, 192);
    ctx.fillStyle = '#334155';
    ctx.font = '11px "Times New Roman", Arial';
    ctx.fillText('Dùng tua-vít và cờ-lê vặn chặt', 637, 212);
    ctx.fillText('ốc vít với đai ốc đúng vị trí.', 637, 228);

    // Dụng cụ Tua-vít & Cờ-lê đặt bên ngoài mặt bàn phía dưới để học sinh dễ quan sát
    drawRoundedRect(ctx, 536, 272, 202, 78, 10, 'rgba(255,255,255,0.92)', '#D97706', 1.8);
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 12px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT', 637, 294);
    ctx.fillStyle = '#334155';
    ctx.font = '11.5px "Times New Roman", Arial';
    ctx.fillText('• Hộp đựng phân ngăn các chi tiết', 637, 314);
    ctx.fillText('• Dụng cụ: Tua-vít, cờ-lê, ốc vít', 637, 332);

    // Thanh nhãn tổng quan dưới cùng trên mặt bàn
    drawRoundedRect(ctx, 26, 362, 712, 38, 8, 'rgba(15, 23, 42, 0.86)', '#38BDF8', 1.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        'HỘP BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT TIỂU HỌC (ĐẦY ĐỦ CÁC NGĂN CHI TIẾT, TUA-VÍT, CỜ-LÊ & HƯỚNG DẪN)',
        382,
        381
    );
};

/**
 * 3. HÌNH ẢNH MÔ HÌNH KỸ THUẬT ĐÃ LẮP GHÉP (XE CẦN CẨU, XE TẢI, CỐI XAY GIÓ, ĐIỆN MẶT TRỜI, CẦU VƯỢT, XÍCH ĐU, CÂN...)
 */
const drawAssembledTechnicalModelScene = (ctx: CanvasRenderingContext2D, primaryLower: string, cleanDesc: string) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(1, '#E2E8F0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#64748B', 2);

    const isWindOrSolar =
        primaryLower.includes('gió') ||
        primaryLower.includes('mặt trời') ||
        primaryLower.includes('năng lượng');

    // Mặt bàn kỹ thuật
    drawRoundedRect(ctx, 20, 330, 720, 68, 8, '#CBD5E1', '#64748B', 1.5);

    if (isWindOrSolar) {
        // Vẽ Mô hình Máy phát điện gió / Điện mặt trời lắp ghép
        // Chân đế
        drawRoundedRect(ctx, 300, 308, 160, 24, 6, '#2563EB', '#1E3A8A', 2);
        // Cột trụ thanh thẳng có lỗ
        drawRoundedRect(ctx, 368, 130, 24, 180, 4, '#16A34A', '#14532D', 2);
        for (let y = 146; y < 300; y += 22) {
            ctx.beginPath();
            ctx.arc(380, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        // Hộp tuabin & cánh quạt
        drawRoundedRect(ctx, 352, 108, 56, 34, 8, '#F59E0B', '#B45309', 2);
        [0, 120, 240].forEach(deg => {
            ctx.save();
            ctx.translate(380, 125);
            ctx.rotate((deg * Math.PI) / 180);
            drawRoundedRect(ctx, -8, -88, 16, 78, 8, '#38BDF8', '#0284C7', 1.8);
            ctx.restore();
        });
        ctx.beginPath();
        ctx.arc(380, 125, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();

        drawTechnicalCallout(ctx, 380, 70, 230, 80, '1. Cánh quạt & Rô-to', 'Quay khi có luồng gió tác động', 'right', '#0284C7');
        drawTechnicalCallout(ctx, 380, 210, 230, 200, '2. Trụ đỡ lắp ghép', 'Gồm các thanh thẳng bắt ốc vít', 'right', '#16A34A');
        drawTechnicalCallout(ctx, 400, 125, 520, 130, '3. Hộp động cơ phát điện', 'Chuyển đổi cơ năng thành điện năng', 'left', '#D97706');
        drawTechnicalCallout(ctx, 430, 318, 520, 280, '4. Chân đế giữ thăng bằng', 'Cố định chắc chắn mô hình trên mặt phẳng', 'left', '#2563EB');
    } else {
        // Vẽ Mô hình Xe kỹ thuật / Xe cần cẩu lắp ghép bằng các thanh kim loại đục lỗ và bánh xe
        // Khung gầm xe (Thanh thẳng dài màu xanh)
        drawRoundedRect(ctx, 250, 244, 260, 24, 6, '#2563EB', '#1E3A8A', 2);
        for (let x = 268; x <= 492; x += 24) {
            ctx.beginPath();
            ctx.arc(x, 256, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        // Cabin & Giá đỡ (Thanh chữ U màu xanh lá & đỏ)
        drawRoundedRect(ctx, 266, 168, 88, 76, 8, '#16A34A', '#14532D', 2);
        drawRoundedRect(ctx, 278, 180, 64, 40, 4, '#E0F2FE', '#0284C7', 1.5);

        // Cần cẩu / Giá nâng nghiêng (Thanh thẳng màu vàng + ròng rọc)
        ctx.save();
        ctx.translate(380, 244);
        ctx.rotate(-0.55);
        drawRoundedRect(ctx, 0, -14, 170, 20, 5, '#F59E0B', '#B45309', 2);
        for (let i = 16; i < 160; i += 22) {
            ctx.beginPath();
            ctx.arc(i, -4, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        ctx.restore();

        // Ròng rọc & dây móc cẩu ở đỉnh cần
        ctx.beginPath();
        ctx.arc(516, 152, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(516, 166);
        ctx.lineTo(516, 224);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        drawRoundedRect(ctx, 502, 224, 28, 24, 4, '#F97316', '#9A3412', 1.8);

        // Bánh xe trước & sau
        [300, 456].forEach(wx => {
            ctx.beginPath();
            ctx.arc(wx, 284, 32, 0, Math.PI * 2);
            ctx.fillStyle = '#1E293B';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx, 284, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#FACC15';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(wx, 284, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#475569';
            ctx.fill();
        });

        drawTechnicalCallout(ctx, 290, 190, 225, 95, '1. Khung cabin & Giá đỡ', 'Lắp từ các thanh chữ U và tấm nhỏ', 'right', '#16A34A');
        drawTechnicalCallout(ctx, 290, 256, 225, 190, '2. Khung sàn xe & Mối ghép', 'Các thanh thẳng ghép bằng ốc vít, đai ốc', 'right', '#2563EB');
        drawTechnicalCallout(ctx, 300, 296, 225, 285, '3. Hệ thống bánh xe & Trục', 'Giúp mô hình di chuyển linh hoạt', 'right', '#D97706');
        drawTechnicalCallout(ctx, 455, 185, 535, 110, '4. Cần nâng & Ròng rọc', 'Cơ cấu truyền động và nâng vật', 'left', '#DC2626');
    }

    // Nhãn tên mô hình dưới đáy
    drawRoundedRect(ctx, 40, 344, 680, 42, 8, '#FFFFFF', '#0284C7', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    const shortTitle = wrapCanvasText(ctx, `Mô hình kỹ thuật trực quan: ${cleanDesc}`, 650, 1)[0];
    ctx.fillText(shortTitle, 380, 365);
};

/**
 * 4. HÌNH ẢNH CẤU TẠO ĐÈN HỌC / ĐỒ DÙNG ĐIỆN / MẠCH ĐIỆN THỰC TẾ
 */
const drawElectricalApplianceOrLampScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(1, '#E2E8F0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#64748B', 2);

    // Đế đèn học
    drawRoundedRect(ctx, 290, 326, 170, 34, 14, '#1E293B', '#0F172A', 2);
    // Công tắc bật/tắt trên đế đèn
    drawRoundedRect(ctx, 355, 318, 36, 12, 4, '#EF4444', '#991B1B', 1.5);

    // Thân đèn uốn cong / khớp xoay
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(335, 326);
    ctx.lineTo(315, 200);
    ctx.lineTo(385, 110);
    ctx.stroke();

    // Khớp vặn điều chỉnh
    ctx.beginPath();
    ctx.arc(315, 200, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();

    // Chụp đèn (Shade)
    ctx.beginPath();
    ctx.moveTo(370, 95);
    ctx.lineTo(465, 130);
    ctx.lineTo(415, 185);
    ctx.closePath();
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bóng đèn LED phát sáng
    ctx.beginPath();
    ctx.arc(432, 152, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chùm sáng chiếu xuống
    ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
    ctx.beginPath();
    ctx.moveTo(415, 180);
    ctx.lineTo(465, 135);
    ctx.lineTo(540, 350);
    ctx.lineTo(350, 350);
    ctx.closePath();
    ctx.fill();

    // Dây nguồn và phích cắm điện
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(290, 344);
    ctx.bezierCurveTo(230, 350, 220, 310, 180, 325);
    ctx.stroke();
    drawRoundedRect(ctx, 152, 314, 28, 22, 4, '#334155', '#0F172A', 1.5);

    drawTechnicalCallout(ctx, 425, 125, 515, 85, '1. Chụp đèn (Chao đèn)', 'Bảo vệ bóng đèn, tập trung ánh sáng', 'left', '#0284C7');
    drawTechnicalCallout(ctx, 435, 155, 515, 165, '2. Bóng đèn LED', 'Phát ra ánh sáng dịu, tiết kiệm điện', 'left', '#CA8A04');
    drawTechnicalCallout(ctx, 315, 200, 235, 150, '3. Thân đèn & Khớp xoay', 'Điều chỉnh độ cao và góc chiếu sáng', 'right', '#475569');
    drawTechnicalCallout(ctx, 373, 322, 515, 265, '4. Công tắc & Đế đèn', 'Bật/tắt đèn và giữ đèn đứng vững', 'left', '#DC2626');
    drawTechnicalCallout(ctx, 168, 325, 235, 265, '5. Dây nguồn & Phích cắm', 'Kết nối an toàn với nguồn điện', 'right', '#0F172A');
};

/**
 * 5. HÌNH ẢNH CHẬU HOA / CÂY CẢNH / GIEO HẠT & DỤNG CỤ TRỒNG CÂY
 */
const drawPlantAndGardeningScene = (ctx: CanvasRenderingContext2D) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F0FDF4');
    bgGrad.addColorStop(1, '#DCFCE7');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#16A34A', 2);

    // Chậu cây đất nung cắt dọc một phần để thấy lớp giá thể và lỗ thoát nước
    ctx.beginPath();
    ctx.moveTo(295, 210);
    ctx.lineTo(465, 210);
    ctx.lineTo(440, 360);
    ctx.lineTo(320, 360);
    ctx.closePath();
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Viền miệng chậu
    drawRoundedRect(ctx, 284, 194, 192, 22, 6, '#B45309', '#78350F', 2);

    // Mặt cắt bên trong chậu: Giá thể trồng cây + Sỏi thoát nước
    drawRoundedRect(ctx, 322, 222, 116, 96, 6, '#573B26', '#3E2723', 1.5);
    drawRoundedRect(ctx, 326, 322, 108, 28, 6, '#94A3B8', '#475569', 1.5);

    // Thân cây, lá và hoa
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(380, 222);
    ctx.lineTo(380, 95);
    ctx.stroke();

    // Rễ cây trong giá thể
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2.2;
    [-22, 0, 22].forEach(rx => {
        ctx.beginPath();
        ctx.moveTo(380, 225);
        ctx.lineTo(380 + rx, 275);
        ctx.lineTo(380 + rx * 1.4, 305);
        ctx.stroke();
    });

    // Lá cây xanh
    [
        { x: 350, y: 155, ang: -0.5 },
        { x: 410, y: 145, ang: 0.5 },
        { x: 348, y: 120, ang: -0.4 },
        { x: 412, y: 112, ang: 0.4 }
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

    // Bông hoa nở trên đỉnh
    for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(380 + Math.cos(ang) * 18, 76 + Math.sin(ang) * 18, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#F43F5E';
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(380, 76, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();

    drawTechnicalCallout(ctx, 392, 76, 515, 72, '1. Hoa, Lá & Thân cây', 'Bộ phận phát triển phía trên mặt chậu', 'left', '#16A34A');
    drawTechnicalCallout(ctx, 300, 205, 240, 155, '2. Chậu trồng hoa, cây cảnh', 'Có kích thước phù hợp và lỗ thoát nước', 'right', '#D97706');
    drawTechnicalCallout(ctx, 365, 265, 240, 255, '3. Giá thể & Rễ cây', 'Giữ cây đứng vững, cung cấp chất dinh dưỡng', 'right', '#78350F');
    drawTechnicalCallout(ctx, 415, 336, 515, 315, '4. Lớp sỏi & Lỗ thoát nước', 'Giúp chậu cây không bị ngập úng', 'left', '#475569');
};

/**
 * 6. VẼ GIAO DIỆN TRANG WEB MẪU / HÌNH 7 (THÔNG TIN TRÊN TRANG WEB: VĂN BẢN, HÌNH ẢNH, VIDEO, ÂM THANH)
 */
const drawWebpageInformationScene = (
    ctx: CanvasRenderingContext2D,
    primaryText: string,
    primaryLower: string
) => {
    const figMatch = primaryText.match(/hình\s*(\d+[a-z]?)/i);
    const exMatch = primaryText.match(/bài\s*tập\s*(\d+)/i);
    const hasNumberedPositions =
        /đánh\s*số|vị\s*trí\s*(số\s*)?\d|số\s*1\s*,\s*2|1\s*,\s*2\s*,\s*3|\(1\)|\(2\)|hình\s*7/i.test(primaryLower);
    const isClassificationExercise =
        /phân\s*loại|chỉ\s*ra\s*đâu\s*là|bài\s*tập|trang\s*web\s*mẫu|thành\s*phần\s*khác\s*nhau/i.test(primaryLower);

    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 36, 10, '#0284C7');
    ['#EF4444', '#F59E0B', '#22C55E'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(36 + i * 16, 34, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
    });

    const browserTitle = figMatch
        ? `TRÌNH DUYỆT WEB • HÌNH ${figMatch[1].toUpperCase()}: CÁC DẠNG THÔNG TIN TRÊN TRANG WEB`
        : isClassificationExercise
            ? `TRANG WEB MẪU • ${exMatch ? `BÀI TẬP ${exMatch[1]}: ` : ''}NHẬN DIỆN THÔNG TIN VĂN BẢN, HÌNH ẢNH, VIDEO`
            : 'GIAO DIỆN TRANG WEB MINH HỌA • VĂN BẢN, HÌNH ẢNH, ÂM THANH & VIDEO';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px "Times New Roman", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(browserTitle, 88, 34);

    // Thanh địa chỉ URL
    drawRoundedRect(ctx, 30, 62, 700, 28, 6, '#FFFFFF', '#CBD5E1', 1.2);
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔒 https://khamphatinhoc-tieuhoc.edu.vn/thong-tin-tren-trang-web', 44, 76);

    const posIdxText = primaryLower.indexOf('văn bản') >= 0 ? primaryLower.indexOf('văn bản') : 999;
    const posIdxImg = primaryLower.indexOf('hình ảnh') >= 0 ? primaryLower.indexOf('hình ảnh') : 999;
    const posIdxVid = primaryLower.indexOf('video') >= 0 ? primaryLower.indexOf('video') : (primaryLower.indexOf('âm thanh') >= 0 ? primaryLower.indexOf('âm thanh') : 999);

    const itemsOrder = [
        { key: 'text', pos: posIdxText },
        { key: 'image', pos: posIdxImg },
        { key: 'video', pos: posIdxVid }
    ].sort((a, b) => a.pos - b.pos);

    const numMap: Record<string, number> = { text: 1, image: 2, video: 3 };
    if (hasNumberedPositions && (posIdxText !== 999 || posIdxImg !== 999 || posIdxVid !== 999)) {
        itemsOrder.forEach((item, idx) => {
            numMap[item.key] = idx + 1;
        });
    }

    // KHU VỰC 1: THÔNG TIN VĂN BẢN
    drawRoundedRect(ctx, 30, 102, 340, 224, 8, '#FFFFFF', '#2563EB', 1.8);
    drawRoundedRect(ctx, 40, 112, 320, 28, 5, '#DBEAFE');
    ctx.fillStyle = '#1E40AF';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📄 THÔNG TIN DẠNG VĂN BẢN (CHỮ VIẾT)', 50, 126);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.fillText('Bản tin: Khám phá thiên nhiên Việt Nam', 48, 158);

    ctx.fillStyle = '#334155';
    ctx.font = '12.5px "Times New Roman", Arial';
    [
        '• Trang web cung cấp bài viết giới thiệu về',
        '  danh lam thắng cảnh, số liệu và kiến thức.',
        '• Bao gồm các chữ cái, con số, đoạn văn giúp',
        '  học sinh đọc và tìm hiểu nội dung bài học.',
        '• Có chứa siêu liên kết (Hyperlink) dẫn tới',
        '  các trang thông tin chi tiết liên quan.'
    ].forEach((l, i) => {
        ctx.fillText(l, 48, 182 + i * 19);
    });
    drawBadgeLabel(ctx, 'Dạng Văn bản (Chữ & Số)', 200, 306, '#EFF6FF', '#2563EB', '#1D4ED8');

    // KHU VỰC 2: THÔNG TIN HÌNH ẢNH
    drawRoundedRect(ctx, 382, 102, 168, 224, 8, '#FFFFFF', '#16A34A', 1.8);
    drawRoundedRect(ctx, 390, 112, 152, 28, 5, '#DCFCE7');
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 12px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🖼️ THÔNG TIN HÌNH ẢNH', 466, 126);

    drawRoundedRect(ctx, 396, 148, 140, 126, 6, '#E0F2FE', '#38BDF8', 1.2);
    ctx.beginPath();
    ctx.arc(424, 174, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(396, 260);
    ctx.lineTo(438, 204);
    ctx.lineTo(476, 244);
    ctx.lineTo(504, 212);
    ctx.lineTo(536, 260);
    ctx.closePath();
    ctx.fillStyle = '#22C55E';
    ctx.fill();

    drawBadgeLabel(ctx, 'Dạng Hình ảnh', 466, 306, '#DCFCE7', '#16A34A', '#15803D');

    // KHU VỰC 3: THÔNG TIN VIDEO & ÂM THANH
    drawRoundedRect(ctx, 562, 102, 168, 224, 8, '#FFFFFF', '#EA580C', 1.8);
    drawRoundedRect(ctx, 570, 112, 152, 28, 5, '#FFEDD5');
    ctx.fillStyle = '#9A3412';
    ctx.font = 'bold 12px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎬 VIDEO & ÂM THANH', 646, 126);

    drawRoundedRect(ctx, 576, 148, 140, 96, 6, '#1E293B', '#475569', 1.2);
    ctx.beginPath();
    ctx.arc(646, 192, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(640, 182);
    ctx.lineTo(657, 192);
    ctx.lineTo(640, 202);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '11px Arial';
    ctx.fillText('🔊 01:25 / 03:40', 646, 232);

    drawRoundedRect(ctx, 576, 252, 140, 32, 5, '#FFF7ED', '#F97316', 1);
    ctx.fillStyle = '#C2410C';
    ctx.font = 'bold 11.5px "Times New Roman", Arial';
    ctx.fillText('🔊 Bản nhạc & Thuyết minh', 646, 268);

    drawBadgeLabel(ctx, 'Dạng Video & Âm thanh', 646, 306, '#FFEDD5', '#EA580C', '#9A3412');

    drawNumberedCalloutCircle(ctx, numMap.text, 348, 126, 14);
    drawNumberedCalloutCircle(ctx, numMap.image, 528, 126, 14);
    drawNumberedCalloutCircle(ctx, numMap.video, 708, 126, 14);

    drawRoundedRect(ctx, 30, 338, 700, 50, 8, '#FEF3C7', '#F59E0B', 1.5);
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `Chú giải: (${numMap.text}) Thông tin dạng Văn bản (chữ, số)   •   (${numMap.image}) Thông tin dạng Hình ảnh (tranh, ảnh)   •   (${numMap.video}) Thông tin dạng Video & Âm thanh`,
        380,
        363
    );
};

/**
 * 7. VẼ MÀN HÌNH HIỂN THỊ 4 DẠNG THÔNG TIN ĐA PHƯƠNG TIỆN (VĂN BẢN, HÌNH ẢNH, ÂM THANH, VIDEO)
 */
const drawMultimediaTypesOnScreenScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 40, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CÁC DẠNG THÔNG TIN CƠ BẢN TRÊN MÁY TÍNH & INTERNET', 380, 36);

    const cards = [
        {
            x: 34,
            w: 162,
            title: '1. DẠNG VĂN BẢN',
            sub: '(Chữ viết, con số)',
            bg: '#EFF6FF',
            border: '#2563EB',
            headerBg: '#DBEAFE',
            textColor: '#1E40AF',
            type: 'text'
        },
        {
            x: 210,
            w: 162,
            title: '2. DẠNG HÌNH ẢNH',
            sub: '(Tranh vẽ, ảnh chụp)',
            bg: '#F0FDF4',
            border: '#16A34A',
            headerBg: '#DCFCE7',
            textColor: '#166534',
            type: 'image'
        },
        {
            x: 386,
            w: 162,
            title: '3. DẠNG ÂM THANH',
            sub: '(Tiếng nói, bản nhạc)',
            bg: '#FFFBEB',
            border: '#D97706',
            headerBg: '#FEF3C7',
            textColor: '#92400E',
            type: 'audio'
        },
        {
            x: 562,
            w: 162,
            title: '4. DẠNG VIDEO',
            sub: '(Phim, clip chuyển động)',
            bg: '#FEF2F2',
            border: '#DC2626',
            headerBg: '#FEE2E2',
            textColor: '#991B1B',
            type: 'video'
        }
    ];

    cards.forEach(c => {
        drawRoundedRect(ctx, c.x, 76, c.w, 304, 10, c.bg, c.border, 2);
        drawRoundedRect(ctx, c.x + 8, 86, c.w - 16, 52, 6, c.headerBg);
        ctx.fillStyle = c.textColor;
        ctx.font = 'bold 13px "Times New Roman", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.title, c.x + c.w / 2, 104);
        ctx.font = 'italic 12px "Times New Roman", Arial';
        ctx.fillText(c.sub, c.x + c.w / 2, 124);

        const icX = c.x + c.w / 2;
        const icY = 216;
        drawRoundedRect(ctx, c.x + 18, 152, c.w - 36, 132, 8, '#FFFFFF', c.border, 1.4);

        if (c.type === 'text') {
            ctx.fillStyle = '#1D4ED8';
            ctx.font = 'bold 26px "Times New Roman", serif';
            ctx.fillText('Aa Bb 123', icX, icY - 22);
            ctx.fillStyle = '#475569';
            ctx.font = '12px Arial';
            ctx.fillText('Bài viết, sách báo,', icX, icY + 14);
            ctx.fillText('tài liệu chữ & số', icX, icY + 34);
        } else if (c.type === 'image') {
            ctx.beginPath();
            ctx.arc(icX - 24, icY - 26, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#FACC15';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(icX - 46, icY + 26);
            ctx.lineTo(icX - 12, icY - 12);
            ctx.lineTo(icX + 18, icY + 18);
            ctx.lineTo(icX + 34, icY - 4);
            ctx.lineTo(icX + 48, icY + 26);
            ctx.closePath();
            ctx.fillStyle = '#22C55E';
            ctx.fill();
            ctx.fillStyle = '#166534';
            ctx.font = '12px Arial';
            ctx.fillText('Tranh vẽ, ảnh chụp,', icX, icY + 46);
        } else if (c.type === 'audio') {
            const bars = [18, 36, 52, 28, 46, 22, 38];
            bars.forEach((bh, bi) => {
                drawRoundedRect(ctx, icX - 42 + bi * 13, icY - bh / 2 - 10, 8, bh, 3, '#D97706');
            });
            ctx.fillStyle = '#92400E';
            ctx.font = '12px Arial';
            ctx.fillText('Giọng đọc, bài hát,', icX, icY + 34);
            ctx.fillText('âm thanh phát ra', icX, icY + 52);
        } else if (c.type === 'video') {
            drawRoundedRect(ctx, icX - 44, icY - 38, 88, 54, 6, '#1E293B');
            ctx.beginPath();
            ctx.arc(icX, icY - 11, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#EF4444';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(icX - 5, icY - 18);
            ctx.lineTo(icX + 8, icY - 11);
            ctx.lineTo(icX - 5, icY - 4);
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.fillStyle = '#991B1B';
            ctx.font = '12px Arial';
            ctx.fillText('Hình ảnh chuyển động', icX, icY + 34);
            ctx.fillText('kèm theo âm thanh', icX, icY + 52);
        }

        drawBadgeLabel(ctx, 'Quan sát & Nhận biết', icX, 344, '#FFFFFF', c.border, c.textColor);
    });
};

/**
 * 8. VẼ CÁC CỔNG KẾT NỐI VẬT LÝ & KHẮC PHỤC SỰ CỐ KỸ THUẬT MÁY TÍNH
 */
const drawConnectionPortsAndTroubleshootingScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);

    // Nửa trái: Các cổng kết nối vật lý trên thân máy
    drawRoundedRect(ctx, 30, 32, 340, 356, 10, '#FFFFFF', '#0284C7', 2);
    drawRoundedRect(ctx, 40, 42, 320, 34, 6, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔌 CÁC CỔNG KẾT NỐI TRÊN THÂN MÁY', 200, 59);

    const ports = [
        { y: 92, name: 'Cổng USB (Chuột, Bàn phím, USB)', desc: 'Hình chữ nhật phẳng, cắm đúng chiều', color: '#2563EB' },
        { y: 176, name: 'Cổng HDMI / VGA (Màn hình, Máy chiếu)', desc: 'Truyền hình ảnh & âm thanh chất lượng cao', color: '#7C3AED' },
        { y: 260, name: 'Cổng Âm thanh / Mạng LAN (Loa, Internet)', desc: 'Giắc tròn 3.5mm (xanh/hồng) & cổng RJ45', color: '#16A34A' }
    ];

    ports.forEach((p, idx) => {
        drawRoundedRect(ctx, 44, p.y, 312, 72, 8, '#F8FAFC', p.color, 1.5);
        drawRoundedRect(ctx, 56, p.y + 18, 66, 36, 5, '#1E293B', p.color, 2);
        if (idx === 0) {
            drawRoundedRect(ctx, 68, p.y + 26, 42, 10, 2, '#3B82F6');
        } else if (idx === 1) {
            drawRoundedRect(ctx, 66, p.y + 28, 46, 14, 3, '#A855F7');
        } else {
            ctx.beginPath();
            ctx.arc(76, p.y + 36, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#22C55E';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(102, p.y + 36, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#EC4899';
            ctx.fill();
        }

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12.5px "Times New Roman", Arial';
        ctx.textAlign = 'left';
        ctx.fillText(p.name, 134, p.y + 28);
        ctx.fillStyle = '#475569';
        ctx.font = '12px "Times New Roman", Arial';
        ctx.fillText(p.desc, 134, p.y + 50);
    });

    // Nửa phải: Quy trình kiểm tra & khắc phục sự cố cơ bản
    drawRoundedRect(ctx, 386, 32, 344, 356, 10, '#FFFFFF', '#DC2626', 2);
    drawRoundedRect(ctx, 396, 42, 324, 34, 6, '#DC2626');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛠️ THAO TÁC KIỂM TRA & KHẮC PHỤC SỰ CỐ', 558, 59);

    const steps = [
        {
            num: 'Bước 1',
            title: 'Kiểm tra đầu dây cáp kết nối',
            detail: 'Quan sát xem đầu cáp USB/HDMI có bị lỏng hoặc cắm sai cổng không.'
        },
        {
            num: 'Bước 2',
            title: 'Cắm lại nhẹ nhàng, đúng chiều',
            detail: 'Đẩy thẳng đầu cáp vào đúng cổng tương ứng, không ấn mạnh khi lệch.'
        },
        {
            num: 'Bước 3',
            title: 'Kiểm tra đèn tín hiệu & Báo giáo viên',
            detail: 'Xem đèn báo chuột/màn hình đã sáng chưa; nhờ người lớn khi cần.'
        }
    ];

    steps.forEach((st, idx) => {
        const y = 92 + idx * 92;
        drawRoundedRect(ctx, 400, y, 316, 78, 8, '#FEF2F2', '#FCA5A5', 1.5);
        drawBadgeLabel(ctx, st.num, 444, y + 24, '#DC2626', '#991B1B', '#FFFFFF');
        ctx.fillStyle = '#991B1B';
        ctx.font = 'bold 13px "Times New Roman", Arial';
        ctx.textAlign = 'left';
        ctx.fillText(st.title, 488, y + 24);

        ctx.fillStyle = '#334155';
        ctx.font = '12px "Times New Roman", Arial';
        const lines = wrapCanvasText(ctx, st.detail, 290, 2);
        lines.forEach((l, li) => {
            ctx.fillText(l, 412, y + 48 + li * 16);
        });
    });
};

/**
 * 9. VẼ THẺ THIẾT BỊ PHẦN CỨNG & PHẦN MỀM CỤ THỂ
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
        subtitle: 'Thiết bị ngoại vi dùng để in văn bản, hình ảnh ra giấy',
        color: '#0284C7',
        bg: '#F0F9FF'
    },
    {
        id: 'hdd',
        keywords: ['ổ đĩa cứng', 'ổ cứng'],
        title: 'Ổ ĐĨA CỨNG (HDD / SSD)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: 'Thiết bị phần cứng lưu trữ dữ liệu bên trong hoặc ngoài thân máy',
        color: '#2563EB',
        bg: '#EFF6FF'
    },
    {
        id: 'usb_drive',
        keywords: ['usb', 'thẻ nhớ', 'bộ nhớ ngoài'],
        title: 'THIẾT BỊ NHỚ USB',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: 'Thiết bị phần cứng nhỏ gọn dùng để lưu và di chuyển tệp',
        color: '#0D9488',
        bg: '#F0FDFA'
    },
    {
        id: 'speaker',
        keywords: ['loa máy tính', 'loa', 'tai nghe'],
        title: 'LOA MÁY TÍNH (SPEAKER)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: 'Thiết bị phần cứng đưa thông tin âm thanh ra bên ngoài',
        color: '#4F46E5',
        bg: '#EEF2FF'
    },
    {
        id: 'monitor',
        keywords: ['màn hình'],
        title: 'MÀN HÌNH (MONITOR)',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: 'Thiết bị phần cứng hiển thị hình ảnh và kết quả làm việc',
        color: '#0369A1',
        bg: '#F0F9FF'
    },
    {
        id: 'keyboard_mouse',
        keywords: ['bàn phím', 'chuột máy tính'],
        title: 'BÀN PHÍM & CHUỘT',
        category: 'PHẦN CỨNG MÁY TÍNH',
        subtitle: 'Thiết bị phần cứng dùng để nhập dữ liệu và điều khiển',
        color: '#1D4ED8',
        bg: '#EFF6FF'
    },
    {
        id: 'typing_app',
        keywords: ['luyện gõ bàn phím', 'phần mềm luyện gõ', 'rapidtyping', 'ứng dụng luyện gõ'],
        title: 'ỨNG DỤNG LUYỆN GÕ BÀN PHÍM',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: 'Chương trình phần mềm giúp rèn kỹ năng gõ phím 10 ngón',
        color: '#16A34A',
        bg: '#F0FDF4'
    },
    {
        id: 'word_app',
        keywords: ['phần mềm soạn thảo', 'microsoft word', 'ứng dụng soạn thảo'],
        title: 'PHẦN MỀM SOẠN THẢO WORD',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: 'Chương trình phần mềm dùng để gõ và trình bày văn bản',
        color: '#15803D',
        bg: '#F0FDF4'
    },
    {
        id: 'paint_app',
        keywords: ['phần mềm vẽ', 'ms paint', 'ứng dụng vẽ'],
        title: 'PHẦN MỀM ĐỒ HỌA PAINT',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: 'Chương trình phần mềm giúp vẽ tranh và tô màu trên máy tính',
        color: '#D97706',
        bg: '#FFFBEB'
    },
    {
        id: 'browser_app',
        keywords: ['trình duyệt web', 'google chrome', 'cốc cốc'],
        title: 'TRÌNH DUYỆT WEB (CHROME)',
        category: 'PHẦN MỀM MÁY TÍNH',
        subtitle: 'Chương trình phần mềm dùng để truy cập và xem các trang web',
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
        drawRoundedRect(ctx, cx - 32, cy - 38, 64, 24, 3, '#FFFFFF', '#64748B', 1.5);
        drawRoundedRect(ctx, cx - 48, cy - 16, 96, 40, 8, '#334155', color, 2);
        drawRoundedRect(ctx, cx - 34, cy + 16, 68, 26, 3, '#FFFFFF', '#3B82F6', 1.5);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy + 25);
        ctx.lineTo(cx + 22, cy + 25);
        ctx.moveTo(cx - 22, cy + 33);
        ctx.lineTo(cx + 12, cy + 33);
        ctx.stroke();
    } else if (itemId === 'hdd') {
        drawRoundedRect(ctx, cx - 40, cy - 38, 80, 76, 8, '#1E293B', color, 2);
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 24, cy + 24);
        ctx.lineTo(cx + 2, cy + 4);
        ctx.stroke();
    } else if (itemId === 'typing_app') {
        drawRoundedRect(ctx, cx - 50, cy - 38, 100, 76, 8, '#FFFFFF', color, 2);
        drawRoundedRect(ctx, cx - 50, cy - 38, 100, 18, 6, color);
        ['F', 'J', 'D', 'K'].forEach((k, idx) => {
            drawRoundedRect(ctx, cx - 40 + idx * 21, cy - 12, 17, 17, 4, '#DCFCE7', '#16A34A', 1.2);
            ctx.fillStyle = '#15803D';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(k, cx - 31.5 + idx * 21, cy - 3);
        });
        drawRoundedRect(ctx, cx - 38, cy + 12, 76, 16, 4, '#EFF6FF', '#3B82F6', 1);
    } else if (itemId === 'usb_drive') {
        drawRoundedRect(ctx, cx - 44, cy - 14, 24, 28, 3, '#94A3B8', '#475569', 1.5);
        drawRoundedRect(ctx, cx - 20, cy - 20, 64, 40, 8, color, '#0F172A', 2);
    } else if (itemId === 'speaker') {
        drawRoundedRect(ctx, cx - 32, cy - 36, 64, 72, 8, '#1E293B', color, 2);
        ctx.beginPath();
        ctx.arc(cx, cy + 8, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#94A3B8';
        ctx.fill();
    } else {
        drawRoundedRect(ctx, cx - 44, cy - 32, 88, 64, 8, '#FFFFFF', color, 2);
        ctx.fillStyle = color;
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('THIẾT BỊ / PM', cx, cy + 4);
    }
    ctx.restore();
};

const drawSpecificItemsCardsScene = (
    ctx: CanvasRenderingContext2D,
    matchedItems: SpecificCatalogItem[],
    isClassifyExercise: boolean
) => {
    const items = matchedItems.slice(0, 3);
    while (items.length < 3) {
        const fallback = SPECIFIC_HARDWARE_SOFTWARE_CATALOG.find(c => !items.some(i => i.id === c.id));
        if (fallback) items.push(fallback);
        else break;
    }

    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        isClassifyExercise
            ? 'CÁC THẺ THIẾT BỊ PHẦN CỨNG VÀ PHẦN MỀM MÁY TÍNH'
            : 'MINH HỌA TRỰC QUAN CÁC THIẾT BỊ PHẦN CỨNG & PHẦN MỀM',
        380,
        35
    );

    const cardW = 224;
    const gap = 16;
    const startX = 28;

    items.forEach((it, idx) => {
        const x = startX + idx * (cardW + gap);
        drawRoundedRect(ctx, x, 68, cardW, 320, 10, it.bg, it.color, 2);

        drawRoundedRect(ctx, x + 10, 78, cardW - 20, 34, 6, it.color);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Times New Roman", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${idx + 1}. ${it.title}`, x + cardW / 2, 95);

        drawRoundedRect(ctx, x + 18, 122, cardW - 36, 114, 8, '#FFFFFF', '#CBD5E1', 1.2);
        drawCatalogItemIllustration(ctx, it.id, x + cardW / 2, 179, it.color);

        const isHw = it.category === 'PHẦN CỨNG MÁY TÍNH';
        drawBadgeLabel(
            ctx,
            isClassifyExercise ? `Phân loại: ${it.category}` : it.category,
            x + cardW / 2,
            258,
            isHw ? '#DBEAFE' : '#DCFCE7',
            it.color,
            isHw ? '#1E3A8A' : '#14532D'
        );

        ctx.fillStyle = '#334155';
        ctx.font = '12px "Times New Roman", Arial';
        const descLines = wrapCanvasText(ctx, it.subtitle, cardW - 24, 3);
        descLines.forEach((dl, di) => {
            ctx.fillText(dl, x + cardW / 2, 290 + di * 18);
        });
    });
};

/**
 * 10. VẼ TỔNG QUAN PHẦN CỨNG & PHẦN MỀM MÁY TÍNH ĐỂ BÀN
 */
const drawHardwareSoftwareOverviewScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);

    // Khung bên trái: PHẦN CỨNG (HARDWARE)
    drawRoundedRect(ctx, 28, 30, 344, 360, 10, '#F0F9FF', '#0284C7', 2);
    drawRoundedRect(ctx, 38, 40, 324, 34, 6, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🖥️ PHẦN CỨNG MÁY TÍNH (HARDWARE)', 200, 57);

    // Màn hình
    drawRoundedRect(ctx, 64, 96, 134, 92, 6, '#1E293B', '#334155', 2);
    drawRoundedRect(ctx, 72, 104, 118, 72, 4, '#38BDF8');
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(120, 188, 22, 16);
    ctx.fillRect(98, 204, 66, 6);
    drawBadgeLabel(ctx, 'Màn hình', 131, 226);

    // Thân máy (CPU)
    drawRoundedRect(ctx, 232, 92, 86, 118, 6, '#334155', '#0F172A', 2);
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(275, 118, 6, 0, Math.PI * 2);
    ctx.fill();
    drawRoundedRect(ctx, 248, 138, 54, 12, 3, '#94A3B8');
    drawBadgeLabel(ctx, 'Thân máy', 275, 226);

    // Bàn phím & Chuột
    drawRoundedRect(ctx, 56, 256, 166, 52, 6, '#E2E8F0', '#475569', 1.8);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(66 + c * 19, 264 + r * 14, 14, 9);
        }
    }
    drawBadgeLabel(ctx, 'Bàn phím', 139, 328);

    drawRoundedRect(ctx, 256, 260, 44, 48, 20, '#E2E8F0', '#475569', 1.8);
    drawBadgeLabel(ctx, 'Chuột', 278, 328);

    // Khung bên phải: PHẦN MỀM (SOFTWARE)
    drawRoundedRect(ctx, 388, 30, 344, 360, 10, '#F0FDF4', '#16A34A', 2);
    drawRoundedRect(ctx, 398, 40, 324, 34, 6, '#16A34A');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💿 PHẦN MỀM MÁY TÍNH (SOFTWARE)', 560, 57);

    const swItems = [
        { y: 92, icon: '🪟', title: 'Hệ điều hành (Windows)', desc: 'Điều khiển và quản lý hoạt động máy tính', col: '#0284C7' },
        { y: 162, icon: '📝', title: 'Phần mềm Soạn thảo / Trình chiếu', desc: 'Word, PowerPoint phục vụ học tập', col: '#2563EB' },
        { y: 232, icon: '⌨️', title: 'Ứng dụng Luyện gõ bàn phím & Vẽ', desc: 'RapidTyping, MS Paint, Scratch', col: '#16A34A' },
        { y: 302, icon: '🌐', title: 'Trình duyệt Web (Chrome, Cốc Cốc)', desc: 'Truy cập và xem thông tin trên Internet', col: '#D97706' }
    ];

    swItems.forEach(item => {
        drawRoundedRect(ctx, 406, item.y, 308, 58, 8, '#FFFFFF', item.col, 1.5);
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, 434, item.y + 30);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12.5px "Times New Roman", Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.title, 460, item.y + 22);

        ctx.fillStyle = '#475569';
        ctx.font = '11.5px "Times New Roman", Arial';
        ctx.fillText(item.desc, 460, item.y + 42);
    });
};

/**
 * 11. VẼ BÀN PHÍM & CÁCH ĐẶT TAY HÀNG PHÍM CƠ SỞ
 */
const drawKeyboardErgonomicsScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KHU VỰC BÀN PHÍM & CÁCH ĐẶT TAY TRÊN HÀNG PHÍM CƠ SỞ (GAI PHÍM F VÀ J)', 380, 35);

    const rows = [
        { label: 'Hàng phím số', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], y: 78, color: '#E2E8F0', border: '#94A3B8' },
        { label: 'Hàng phím trên', keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], y: 132, color: '#DBEAFE', border: '#3B82F6' },
        { label: 'Hàng phím cơ sở', keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'], y: 186, color: '#FEF3C7', border: '#D97706' },
        { label: 'Hàng phím dưới', keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'], y: 240, color: '#DCFCE7', border: '#16A34A' }
    ];

    rows.forEach(r => {
        drawBadgeLabel(ctx, r.label, 104, r.y + 20, r.color, r.border, '#0F172A');
        r.keys.forEach((k, idx) => {
            const kx = 190 + idx * 50;
            const isHomeFinger = r.label === 'Hàng phím cơ sở' && ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'].includes(k);
            drawRoundedRect(
                ctx,
                kx,
                r.y,
                42,
                40,
                6,
                isHomeFinger ? '#FDE68A' : r.color,
                isHomeFinger ? '#B45309' : r.border,
                isHomeFinger ? 2.2 : 1.5
            );
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(k, kx + 21, r.y + 20);

            if (k === 'F' || k === 'J') {
                ctx.fillStyle = '#DC2626';
                ctx.fillRect(kx + 14, r.y + 31, 14, 3);
            }
        });
    });

    drawRoundedRect(ctx, 270, 300, 310, 38, 6, '#F1F5F9', '#64748B', 1.8);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PHÍM CÁCH (SPACEBAR) - Hai ngón cái', 425, 319);

    drawRoundedRect(ctx, 40, 350, 680, 38, 8, '#FFFBEB', '#F59E0B', 1.4);
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 12.5px "Times New Roman", Arial';
    ctx.fillText('Hai ngón trỏ đặt lên hai phím có gai F và J • Các ngón còn lại đặt nhẹ lên A S D và K L ;', 380, 369);
};

/**
 * 12. VẼ MÁY TÌM KIẾM THÔNG TIN TRÊN INTERNET
 */
const drawSearchEngineScene = (ctx: CanvasRenderingContext2D, primaryText: string) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#FFFFFF', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 36, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🌐 TRÌNH DUYỆT WEB - MÁY TÌM KIẾM THÔNG TIN (GOOGLE SEARCH)', 36, 34);

    drawRoundedRect(ctx, 36, 64, 688, 28, 6, '#F1F5F9', '#CBD5E1', 1);
    ctx.fillStyle = '#334155';
    ctx.font = '12px Arial';
    ctx.fillText('🔒 https://www.google.com.vn', 50, 78);

    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2563EB';
    ctx.fillText('MÁY TÌM KIẾM', 380, 124);

    drawRoundedRect(ctx, 120, 144, 520, 42, 21, '#FFFFFF', '#2563EB', 2);
    const quotedMatch = primaryText.match(/"([^"]{3,45})"/);
    const sampleKeyword = quotedMatch ? quotedMatch[1] : 'Khám phá thông tin bài học lớp em';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`🔍 Từ khóa tìm kiếm: "${sampleKeyword}"`, 144, 166);

    drawRoundedRect(ctx, 64, 204, 632, 82, 8, '#F8FAFC', '#CBD5E1', 1.5);
    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.fillText('1. Trang thông tin giáo dục dành cho học sinh Tiểu học', 82, 228);
    ctx.fillStyle = '#15803D';
    ctx.font = '11.5px Arial';
    ctx.fillText('https://hoclieuso.edu.vn/bai-hoc-truc-quan', 82, 246);
    ctx.fillStyle = '#334155';
    ctx.font = '12.5px "Times New Roman", Arial';
    ctx.fillText('Kết quả tìm kiếm cung cấp văn bản, hình ảnh và video minh họa đúng từ khóa.', 82, 268);

    drawRoundedRect(ctx, 64, 298, 632, 82, 8, '#F8FAFC', '#CBD5E1', 1.5);
    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.fillText('2. Thư viện hình ảnh và video khoa học thiếu nhi', 82, 322);
    ctx.fillStyle = '#15803D';
    ctx.font = '11.5px Arial';
    ctx.fillText('https://thuvienthieunhi.vn/kham-pha', 82, 340);
    ctx.fillStyle = '#334155';
    ctx.font = '12.5px "Times New Roman", Arial';
    ctx.fillText('Hướng dẫn chọn lọc nguồn thông tin an toàn, chính thống và tôn trọng bản quyền.', 82, 362);
};

/**
 * 13. VẼ AN TOÀN THÔNG TIN, BẢO MẬT & BẢN QUYỀN SỐ
 */
const drawDigitalSafetyScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F0FDF4', '#16A34A', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, '#16A34A');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ QUY TẮC AN TOÀN THÔNG TIN & KĨ NĂNG CÔNG DÂN SỐ', 380, 35);

    const rules = [
        { x: 32, y: 74, title: '1. Bảo vệ thông tin cá nhân', desc: 'Không chia sẻ mật khẩu, địa chỉ nhà, số điện thoại cho người lạ trên mạng.', color: '#0284C7', bg: '#EFF6FF' },
        { x: 392, y: 74, title: '2. Sử dụng mật khẩu mạnh', desc: 'Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt để bảo vệ tài khoản.', color: '#16A34A', bg: '#FFFFFF' },
        { x: 32, y: 234, title: '3. Tôn trọng bản quyền số', desc: 'Ghi rõ nguồn tác giả khi sử dụng văn bản, hình ảnh, video trên Internet.', color: '#D97706', bg: '#FFFBEB' },
        { x: 392, y: 234, title: '4. Ứng xử văn minh & An toàn', desc: 'Chỉ truy cập trang web lành mạnh; báo ngay cho thầy cô, cha mẹ khi gặp rủi ro.', color: '#7C3AED', bg: '#F5F3FF' }
    ];

    rules.forEach(r => {
        drawRoundedRect(ctx, r.x, r.y, 336, 142, 10, r.bg, r.color, 1.8);
        ctx.fillStyle = r.color;
        ctx.font = 'bold 14.5px "Times New Roman", Arial';
        ctx.textAlign = 'left';
        ctx.fillText(r.title, r.x + 18, r.y + 34);

        ctx.fillStyle = '#1E293B';
        ctx.font = '13px "Times New Roman", Arial';
        const lines = wrapCanvasText(ctx, r.desc, 300, 3);
        lines.forEach((line, idx) => {
            ctx.fillText(line, r.x + 18, r.y + 66 + idx * 22);
        });
    });
};

/**
 * 14. VẼ CÂY THƯ MỤC & TỆP TIN (FILE EXPLORER)
 */
const drawFileFolderScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#FFFFFF', '#0284C7', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📁 CỬA SỔ QUẢN LÝ TỆP VÀ THƯ MỤC (FILE EXPLORER)', 36, 35);

    drawRoundedRect(ctx, 32, 68, 230, 318, 8, '#F8FAFC', '#CBD5E1', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.fillText('CÂY THƯ MỤC:', 48, 94);

    const treeItems = [
        { indent: 0, text: '💻 This PC (Máy tính)', active: false },
        { indent: 14, text: '💽 Ổ đĩa (D:)', active: false },
        { indent: 28, text: '📂 Học tập', active: true },
        { indent: 42, text: '📁 Môn Tin học', active: false },
        { indent: 42, text: '📁 Môn Công nghệ', active: false },
        { indent: 42, text: '📁 Môn Tiếng Việt', active: false },
        { indent: 42, text: '📁 Hình ảnh minh họa', active: false }
    ];

    treeItems.forEach((item, idx) => {
        const y = 126 + idx * 34;
        if (item.active) {
            drawRoundedRect(ctx, 42, y - 16, 210, 28, 5, '#DBEAFE', '#3B82F6', 1);
        }
        ctx.fillStyle = item.active ? '#1D4ED8' : '#334155';
        ctx.font = item.active ? 'bold 13px Arial' : '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.text, 50 + item.indent, y);
    });

    drawRoundedRect(ctx, 276, 68, 452, 318, 8, '#FFFFFF', '#CBD5E1', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.fillText('CÁC THƯ MỤC CON VÀ TỆP TRONG THƯ MỤC "HỌC TẬP":', 294, 94);

    const cards = [
        { x: 294, y: 118, label: 'Thư mục Tin học', type: '📁 THƯ MỤC', color: '#F59E0B', bg: '#FEF3C7' },
        { x: 438, y: 118, label: 'Thư mục Toán', type: '📁 THƯ MỤC', color: '#F59E0B', bg: '#FEF3C7' },
        { x: 582, y: 118, label: 'Bai_Tap_1.docx', type: '📄 TỆP VĂN BẢN', color: '#2563EB', bg: '#DBEAFE' },
        { x: 294, y: 238, label: 'Hinh_Ve.png', type: '🖼️ TỆP HÌNH ẢNH', color: '#16A34A', bg: '#DCFCE7' },
        { x: 438, y: 238, label: 'Thuyet_Trinh.pptx', type: '📊 TỆP TRÌNH CHIẾU', color: '#EA580C', bg: '#FFEDD5' },
        { x: 582, y: 238, label: 'Du_An_Scratch.sb3', type: '🧩 TỆP SCRATCH', color: '#7C3AED', bg: '#EDE9FE' }
    ];

    cards.forEach(c => {
        drawRoundedRect(ctx, c.x, c.y, 130, 96, 8, c.bg, c.color, 1.5);
        ctx.fillStyle = c.color;
        ctx.font = 'bold 11.5px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.type, c.x + 65, c.y + 34);
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12.5px "Times New Roman", Arial';
        ctx.fillText(c.label, c.x + 65, c.y + 66);
    });
};

/**
 * 15. VẼ MÔI TRƯỜNG LẬP TRÌNH TRỰC QUAN SCRATCH
 */
const drawScratchProgrammingScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#F8FAFC', '#7C3AED', 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, '#7C3AED');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🧩 MÔI TRƯỜNG LẬP TRÌNH TRỰC QUAN SCRATCH & KHỐI LỆNH', 36, 35);

    drawRoundedRect(ctx, 32, 68, 380, 318, 8, '#FFFFFF', '#DDD6FE', 1.5);
    ctx.fillStyle = '#4C1D95';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.fillText('KỊCH BẢN KHỐI LỆNH ĐIỀU KHIỂN:', 48, 94);

    const blocks = [
        { y: 116, text: '⚑ Khi bấm vào cờ xanh (Sự kiện)', color: '#F59E0B' },
        { y: 164, text: '↻ Lặp lại 4 lần (Điều khiển)', color: '#D97706' },
        { y: 212, text: '   ➜ Di chuyển 100 bước (Chuyển động)', color: '#2563EB' },
        { y: 260, text: '   ↻ Xoay phải 90 độ (Chuyển động)', color: '#2563EB' },
        { y: 308, text: '💬 Nói "Hoàn thành!" trong 2 giây (Hiển thị)', color: '#7C3AED' }
    ];

    blocks.forEach(b => {
        drawRoundedRect(ctx, 48, b.y, 344, 36, 6, b.color);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(b.text, 64, b.y + 18);
    });

    drawRoundedRect(ctx, 428, 68, 300, 318, 8, '#FFFFFF', '#CBD5E1', 1.5);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13.5px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SÂN KHẤU BIỂU DIỄN (STAGE)', 578, 94);

    drawRoundedRect(ctx, 446, 112, 264, 218, 6, '#F0FDF4', '#86EFAC', 1.5);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.strokeRect(496, 152, 100, 100);

    ctx.beginPath();
    ctx.arc(616, 206, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Nhân vật', 616, 206);

    drawBadgeLabel(ctx, 'Kết quả chạy chương trình', 578, 356, '#DCFCE7', '#16A34A', '#14532D');
};

/**
 * 16. VẼ GIAO DIỆN PHẦN MỀM WORD / POWERPOINT / PAINT (CHỈ KHI BÀI HỌC DẠY VỀ PHẦN MỀM ĐÓ)
 */
const drawOfficeOrPaintScene = (ctx: CanvasRenderingContext2D, subjectLower: string, cleanDesc: string) => {
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
    const headerTitle = isPresentation
        ? '📊 GIAO DIỆN PHẦN MỀM TRÌNH CHIẾU POWERPOINT'
        : isPaint
            ? '🎨 GIAO DIỆN PHẦN MỀM ĐỒ HỌA PAINT'
            : '📝 GIAO DIỆN PHẦN MỀM SOẠN THẢO VĂN BẢN WORD';

    drawRoundedRect(ctx, 16, 16, 728, 388, 12, '#FFFFFF', themeColor, 2.5);
    drawRoundedRect(ctx, 16, 16, 728, 38, 10, themeColor);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText(headerTitle, 36, 35);

    drawRoundedRect(ctx, 32, 66, 696, 38, 6, '#F1F5F9', '#CBD5E1', 1);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12.5px Arial';
    if (isPaint) {
        ctx.fillText('Công cụ: [Bút chì ✏️]  [Tô màu 🪣]  [Tẩy 🧽]  |  Hình mẫu: [⬜] [◯] [△]  |  Bảng màu: 🔴 🟠 🟡 🟢 🔵', 48, 85);
    } else {
        ctx.fillText('Phông chữ: Times New Roman  |  Cỡ chữ: 14  |  [B]  [I]  [U]  |  Căn lề  |  Chèn Hình ảnh', 48, 85);
    }

    drawRoundedRect(ctx, 32, 116, 696, 272, 8, '#F8FAFC', '#94A3B8', 1.5);
    drawRoundedRect(ctx, 68, 134, 624, 236, 6, '#FFFFFF', '#CBD5E1', 1);

    ctx.fillStyle = themeColor;
    ctx.font = 'bold 16px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        isPresentation
            ? 'TRANG CHIẾU THỰC HÀNH'
            : isPaint
                ? 'VÙNG VẼ THỰC HÀNH'
                : 'TRANG SOẠN THẢO VĂN BẢN',
        380,
        172
    );

    ctx.fillStyle = '#0F172A';
    ctx.font = '13.5px "Times New Roman", Arial';
    const descLines = wrapCanvasText(ctx, cleanDesc, 560, 4);
    descLines.forEach((line, idx) => {
        ctx.fillText(line, 380, 214 + idx * 24);
    });
};

/**
 * 17. SƠ ĐỒ BÓC TÁCH CẤU TẠO / MÔ HÌNH ĐỐI TƯỢNG TRỰC QUAN TỔNG QUÁT
 * (Tuyệt đối KHÔNG dùng khung phiếu học tập "Thành phần quan sát 1/2", mà vẽ trực tiếp mô hình đối tượng ở trung tâm kèm các nhãn chỉ dẫn kỹ thuật)
 */
const drawVisualObjectDiagramFallback = (
    ctx: CanvasRenderingContext2D,
    cleanDesc: string,
    coreObjectText: string
) => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 420);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(1, '#E2E8F0');
    drawRoundedRect(ctx, 4, 4, 752, 412, 12, bgGrad, '#0284C7', 2);

    // Tách các bộ phận / thành phần của đối tượng từ câu mô tả
    const rawParts = cleanDesc
        .replace(/^(hình ảnh|minh họa|sơ đồ|mô hình|cấu tạo|bộ phận)\s*/i, '')
        .split(/(?:,|;|\bvà\b|\bgồm\b|\bnhư\b)/i)
        .map(s => s.trim())
        .filter(s => s.length >= 3);

    const mainObjectTitle = wrapCanvasText(
        ctx,
        (coreObjectText || cleanDesc).replace(/^[-–\*\s]+/, ''),
        220,
        2
    );

    // Vẽ mô hình đối tượng 3D ở trung tâm
    const cx = 380;
    const cy = 205;

    // Bệ đỡ đối tượng
    ctx.beginPath();
    ctx.ellipse(cx, cy + 105, 110, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E1';
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Khối mô hình chính ở trung tâm
    drawRoundedRect(ctx, cx - 95, cy - 82, 190, 168, 18, '#FFFFFF', '#0284C7', 3);
    drawRoundedRect(ctx, cx - 83, cy - 70, 166, 46, 10, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12.5px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    mainObjectTitle.forEach((line, idx) => {
        ctx.fillText(line.toUpperCase(), cx, (mainObjectTitle.length === 1 ? cy - 47 : cy - 55) + idx * 16);
    });

    // Minh họa cấu trúc kỹ thuật bên trong mô hình trung tâm
    drawRoundedRect(ctx, cx - 72, cy - 12, 64, 42, 6, '#DBEAFE', '#2563EB', 1.5);
    drawRoundedRect(ctx, cx + 8, cy - 12, 64, 42, 6, '#DCFCE7', '#16A34A', 1.5);
    drawRoundedRect(ctx, cx - 72, cy + 38, 144, 34, 6, '#FEF3C7', '#D97706', 1.5);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Cấu trúc A', cx - 40, cy + 9);
    ctx.fillStyle = '#14532D';
    ctx.fillText('Cấu trúc B', cx + 40, cy + 9);
    ctx.fillStyle = '#92400E';
    ctx.fillText('Hệ thống liên kết & Hoạt động', cx, cy + 55);

    const calloutParts = rawParts.length >= 2
        ? rawParts.slice(0, 4)
        : [
            'Bộ phận cấu tạo chính của đối tượng',
            'Chi tiết liên kết và điều khiển',
            'Đặc điểm nhận biết trực quan',
            'Ứng dụng thực hành trong bài học'
        ];

    const calloutCoords = [
        { ox: cx - 72, oy: cy - 35, lx: 245, ly: 92, align: 'right' as const, col: '#0284C7' },
        { ox: cx - 72, oy: cy + 35, lx: 245, ly: 255, align: 'right' as const, col: '#16A34A' },
        { ox: cx + 72, oy: cy - 35, lx: 515, ly: 92, align: 'left' as const, col: '#D97706' },
        { ox: cx + 72, oy: cy + 35, lx: 515, ly: 255, align: 'left' as const, col: '#7C3AED' }
    ];

    calloutParts.forEach((part, idx) => {
        const pos = calloutCoords[idx];
        const shortPart = wrapCanvasText(ctx, part.charAt(0).toUpperCase() + part.slice(1), 175, 1)[0];
        drawTechnicalCallout(
            ctx,
            pos.ox,
            pos.oy,
            pos.lx,
            pos.ly,
            `${idx + 1}. ${shortPart}`,
            'Chi tiết trực quan của đối tượng',
            pos.align,
            pos.col
        );
    });

    drawRoundedRect(ctx, 36, 352, 688, 42, 8, '#FFFFFF', '#0284C7', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12.5px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    const bottomCaption = wrapCanvasText(ctx, cleanDesc, 660, 1)[0];
    ctx.fillText(bottomCaption, 380, 373);
};

/**
 * Tạo hình ảnh trực quan (PNG Data URL) mô tả ĐÚNG ĐỐI TƯỢNG, HỌC CỤ HOẶC MÔ HÌNH KỸ THUẬT
 * được nhắc đến ở câu văn ngay phía trên (`precedingContext`) và mô tả hình ảnh (`rawLine`).
 */
export const renderPedagogicalIllustrationDataUrl = (
    rawLine: string,
    lessonTitle: string = '',
    precedingContext: string = ''
): string => {
    const cleanDesc = extractCleanImageDescription(rawLine);
    const cleanContext = (precedingContext || '').trim();
    const cacheKey = `${lessonTitle}__${cleanContext}__${cleanDesc}`;
    if (imageDataUrlCache.has(cacheKey)) {
        return imageDataUrlCache.get(cacheKey)!;
    }

    if (typeof document === 'undefined') {
        return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Tách bỏ các động từ sư phạm ("Giáo viên trình chiếu hình ảnh...", "GV yêu cầu mở...") để lấy đúng TÊN ĐỐI TƯỢNG / HỌC CỤ
    const coreDescObject = extractCoreVisualObjectText(cleanDesc);
    const coreContextObject = extractCoreVisualObjectText(cleanContext);
    const subjectText = `${coreDescObject} ${coreContextObject}`.trim();
    const subjectLower = subjectText.toLowerCase();

    // 1. NHẬN DIỆN RÔ-BỐT & CÁC BỘ PHẬN CỦA RÔ-BỐT (Ưu tiên số 1 khi câu văn nhắc tới robot/rô-bốt)
    const isRobotTopic =
        subjectLower.includes('rô-bốt') ||
        subjectLower.includes('rô bốt') ||
        subjectLower.includes('robot') ||
        subjectLower.includes('cảm biến') ||
        (subjectLower.includes('bộ điều khiển') && subjectLower.includes('bộ phận'));

    // 2. NHẬN DIỆN BỘ LẮP GHÉP MÔ HÌNH KỸ THUẬT (Hộp dụng cụ, chi tiết thanh thẳng, tua-vít, cờ-lê, ốc vít)
    const isAssemblyKitBox =
        subjectLower.includes('bộ lắp ghép') ||
        subjectLower.includes('hộp lắp ghép') ||
        subjectLower.includes('tua-vít') ||
        subjectLower.includes('tua vít') ||
        subjectLower.includes('cờ-lê') ||
        subjectLower.includes('cờ lê') ||
        (subjectLower.includes('chi tiết') && subjectLower.includes('dụng cụ')) ||
        (subjectLower.includes('thanh thẳng') && (subjectLower.includes('ốc vít') || subjectLower.includes('đai ốc') || subjectLower.includes('bánh răng')));

    // 3. NHẬN DIỆN MÔ HÌNH KỸ THUẬT ĐÃ LẮP GHÉP (Xe cần cẩu, xe tải, cối xay gió, máy phát điện gió, mặt trời, cầu vượt, xích đu...)
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

    // 5. NHẬN DIỆN CHẬU HOA / CÂY CẢNH / GIEO HẠT / THỰC VẬT
    const isPlantOrGardening =
        subjectLower.includes('chậu hoa') ||
        subjectLower.includes('cây cảnh') ||
        subjectLower.includes('giá thể') ||
        subjectLower.includes('gieo hạt') ||
        subjectLower.includes('trồng cây') ||
        subjectLower.includes('trồng hoa');

    // 6. NHẬN DIỆN TRANG WEB / HÌNH 7
    const isWebpageTopic =
        subjectLower.includes('trang web') ||
        subjectLower.includes('website') ||
        subjectLower.includes('siêu văn bản') ||
        subjectLower.includes('siêu liên kết') ||
        /hình\s*7\b/i.test(subjectLower) ||
        (subjectLower.includes('đánh số') && (subjectLower.includes('văn bản') || subjectLower.includes('hình ảnh') || subjectLower.includes('video')));

    // 7. NHẬN DIỆN 4 DẠNG THÔNG TIN ĐA PHƯƠNG TIỆN
    const infoTypeCount = [
        subjectLower.includes('chữ viết') || subjectLower.includes('văn bản'),
        subjectLower.includes('hình ảnh'),
        subjectLower.includes('âm thanh'),
        subjectLower.includes('video')
    ].filter(Boolean).length;

    const isMultimediaInformationTypes =
        subjectLower.includes('các loại thông tin') ||
        subjectLower.includes('các dạng thông tin') ||
        subjectLower.includes('dạng thông tin') ||
        subjectLower.includes('loại thông tin') ||
        infoTypeCount >= 3 ||
        (infoTypeCount >= 2 && (subjectLower.includes('biểu tượng đại diện') || subjectLower.includes('thông tin')));

    // 8. NHẬN DIỆN CỔNG KẾT NỐI & KHẮC PHỤC SỰ CỐ MÁY TÍNH
    const isPortsOrTroubleshooting =
        subjectLower.includes('cổng kết nối') ||
        subjectLower.includes('khắc phục sự cố') ||
        subjectLower.includes('vấn đề kĩ thuật') ||
        subjectLower.includes('vấn đề kỹ thuật') ||
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
        matchedCatalogItems.length >= 2 ||
        matchedCatalogItems.some(it => ['printer', 'hdd', 'typing_app', 'usb_drive', 'speaker'].includes(it.id));

    if (isRobotTopic) {
        drawRobotAnatomyScene(ctx);
    } else if (isAssemblyKitBox) {
        drawTechnicalAssemblyKitScene(ctx);
    } else if (isAssembledTechnicalModel) {
        drawAssembledTechnicalModelScene(ctx, subjectLower, cleanDesc);
    } else if (isElectricalOrLamp) {
        drawElectricalApplianceOrLampScene(ctx);
    } else if (isPlantOrGardening) {
        drawPlantAndGardeningScene(ctx);
    } else if (isWebpageTopic) {
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
        subjectLower.includes('máy tìm kiếm') ||
        subjectLower.includes('từ khóa tìm kiếm') ||
        subjectLower.includes('ô tìm kiếm') ||
        (subjectLower.includes('tìm kiếm') && subjectLower.includes('internet'))
    ) {
        drawSearchEngineScene(ctx, subjectText);
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
        subjectLower.includes('phần mềm') ||
        subjectLower.includes('bộ phận chính của máy tính') ||
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
        drawVisualObjectDiagramFallback(ctx, cleanDesc, coreContextObject || coreDescObject);
    }

    const dataUrl = canvas.toDataURL('image/png');
    imageDataUrlCache.set(cacheKey, dataUrl);
    return dataUrl;
};

/**
 * Tự động gọi AI tạo hình ảnh trực quan thực tế (nếu API key hỗ trợ model tạo ảnh)
 * và lưu vào bộ nhớ đệm `imageDataUrlCache` trước khi hiển thị/xuất Word.
 * Nếu model tạo ảnh bị giới hạn quota trên key miễn phí, hệ thống tự động sử dụng
 * bộ vẽ kỹ thuật độ phân giải cao ở trên mà không làm gián đoạn quá trình tạo bài dạy.
 */
export const pregenerateLessonImagesWithAI = async (
    plan: LessonPlanResponse,
    apiKey: string,
    lessonTitleFallback: string = ''
): Promise<void> => {
    if (!plan || !Array.isArray(plan.periods) || !apiKey) return;

    const tasks: Array<{ cacheKey: string; prompt: string }> = [];

    for (const period of plan.periods) {
        const lessonTitle = plan.lesson_full_title || lessonTitleFallback || '';
        for (const act of period.activities || []) {
            for (const row of act.rows || []) {
                const rawTeacher = (row.teacher || '')
                    .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:|\[Hình ảnh minh họa:|Hình ảnh minh họa:)/gi, '\n$1')
                    .replace(/(\[Tích hợp[^\]]*\]:|-?\s*Tích hợp\s+[^:\n]+:)/gi, '\n$1');

                const lines = rawTeacher.split('\n').map(l => l.trim()).filter(Boolean);
                let runningContext = '';
                for (const line of lines) {
                    if (isImageHintLine(line)) {
                        const cleanDesc = extractCleanImageDescription(line);
                        const cleanContext = runningContext.trim();
                        const cacheKey = `${lessonTitle}__${cleanContext}__${cleanDesc}`;
                        const coreObj = extractCoreVisualObjectText(`${cleanDesc}. ${cleanContext}`);
                        tasks.push({
                            cacheKey,
                            prompt: `High-clarity educational textbook object illustration of: ${coreObj}. Show ONLY the exact physical object, technical model, or educational aid in close-up detail with clean studio lighting. NO classroom scene, NO teachers or students, NO worksheet borders.`
                        });
                    } else if (!/^[-–\*\s]*(\[?\s*Tích\s*hợp\b)/i.test(line)) {
                        runningContext = `${runningContext} ${line.replace(/\*\*/g, '')}`.trim();
                    }
                }
            }
        }
    }

    if (tasks.length === 0) return;

    const ai = new GoogleGenAI({ apiKey });
    await Promise.all(
        tasks.slice(0, 5).map(async task => {
            try {
                const res = await Promise.race([
                    ai.models.generateContent({
                        model: 'gemini-3.1-flash-lite-image',
                        contents: task.prompt
                    }),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 6500))
                ]);
                if (!res) return;
                const parts = (res as any)?.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part?.inlineData?.data && part?.inlineData?.mimeType?.startsWith('image/')) {
                        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        imageDataUrlCache.set(task.cacheKey, dataUrl);
                        break;
                    }
                }
            } catch {
                // Tự động sử dụng bản vẽ kỹ thuật chi tiết trong renderPedagogicalIllustrationDataUrl
            }
        })
    );
};
