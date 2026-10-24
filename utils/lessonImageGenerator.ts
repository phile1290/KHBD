/**
 * Bộ tạo hình ảnh minh họa sư phạm trực quan chuẩn SGK cho Kế hoạch bài dạy (KHBD)
 * Thay thế hoàn toàn dòng chữ "[Gợi ý hình ảnh: ...]" bằng hình ảnh PNG thực tế
 * hiển thị trực tiếp trên bản xem trước (Preview) và nhúng thẳng vào file Word (.docx).
 */

const imageDataUrlCache = new Map<string, string>();

export const isImageHintLine = (line: string): boolean => {
    const trimmed = (line || '').trim();
    return /^[-–\*\s]*(\[|\()?(Gợi ý hình ảnh|Hình ảnh minh họa)/i.test(trimmed);
};

export const extractCleanImageDescription = (rawLine: string): string => {
    let text = (rawLine || '').trim();
    text = text.replace(/^[-–\*\s]+/, '');
    text = text.replace(/^(\[|\()?(Gợi ý hình ảnh|Hình ảnh minh họa)\s*[:\-–]?\s*/i, '');
    text = text.replace(/[\]\)]+$/, '');
    return text.trim() || 'Hình ảnh minh họa nội dung bài học trong Sách giáo khoa';
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
        while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 10) {
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
    fill?: string,
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

const drawBadgeLabel = (
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    bgColor: string = '#EFF6FF',
    borderColor: string = '#3B82F6',
    textColor: string = '#1E3A8A'
) => {
    ctx.font = 'bold 13px "Times New Roman", Arial, sans-serif';
    const w = Math.max(76, ctx.measureText(text).width + 20);
    const h = 24;
    drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 6, bgColor, borderColor, 1.5);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
};

/**
 * Vẽ sơ đồ Phần cứng & Phần mềm máy tính chuẩn SGK Tin học
 */
const drawHardwareSoftwareScene = (ctx: CanvasRenderingContext2D, descLower: string) => {
    const hasSoftware = descLower.includes('phần mềm') || descLower.includes('ứng dụng') || descLower.includes('biểu tượng') || descLower.includes('windows');
    const hasHardware = descLower.includes('phần cứng') || descLower.includes('màn hình') || descLower.includes('thân máy') || descLower.includes('bàn phím') || descLower.includes('chuột') || !hasSoftware;

    if (hasHardware && hasSoftware) {
        // Bố cục 2 cột đối sánh: Phần cứng bên trái - Phần mềm bên phải
        drawRoundedRect(ctx, 26, 56, 342, 270, 12, '#F0F9FF', '#0284C7', 2);
        ctx.fillStyle = '#0369A1';
        ctx.font = 'bold 16px "Times New Roman", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PHẦN CỨNG MÁY TÍNH (HARDWARE)', 197, 80);

        // Màn hình
        drawRoundedRect(ctx, 64, 98, 145, 92, 6, '#1E293B', '#334155', 2);
        drawRoundedRect(ctx, 72, 105, 129, 74, 3, '#38BDF8');
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('MÀN HÌNH', 136, 142);
        // Chân đế màn hình
        ctx.fillStyle = '#475569';
        ctx.fillRect(124, 190, 24, 14);
        ctx.fillRect(104, 204, 64, 6);
        drawBadgeLabel(ctx, 'Màn hình', 136, 224, '#E0F2FE', '#0284C7', '#0C4A6E');

        // Thân máy (CPU)
        drawRoundedRect(ctx, 236, 96, 86, 114, 6, '#334155', '#1E293B', 2);
        drawRoundedRect(ctx, 248, 110, 62, 12, 2, '#94A3B8');
        drawRoundedRect(ctx, 248, 130, 62, 8, 2, '#64748B');
        ctx.beginPath();
        ctx.arc(279, 178, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#22C55E';
        ctx.fill();
        drawBadgeLabel(ctx, 'Thân máy', 279, 224, '#E0F2FE', '#0284C7', '#0C4A6E');

        // Bàn phím
        drawRoundedRect(ctx, 56, 246, 168, 42, 5, '#E2E8F0', '#475569', 1.8);
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 10; c++) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(64 + c * 15, 252 + r * 11, 12, 8);
            }
        }
        drawBadgeLabel(ctx, 'Bàn phím', 140, 306, '#E0F2FE', '#0284C7', '#0C4A6E');

        // Chuột
        drawRoundedRect(ctx, 260, 244, 42, 46, 18, '#F1F5F9', '#475569', 1.8);
        ctx.beginPath();
        ctx.moveTo(281, 244);
        ctx.lineTo(281, 264);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        drawBadgeLabel(ctx, 'Chuột', 281, 306, '#E0F2FE', '#0284C7', '#0C4A6E');

        // Khung bên phải: Phần mềm
        drawRoundedRect(ctx, 392, 56, 342, 270, 12, '#F0FDF4', '#16A34A', 2);
        ctx.fillStyle = '#15803D';
        ctx.font = 'bold 16px "Times New Roman", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PHẦN MỀM MÁY TÍNH (SOFTWARE)', 563, 80);

        const apps = [
            { name: 'Hệ điều hành', sub: 'Windows / macOS', x: 416, y: 100, color: '#0284C7', icon: '⊞' },
            { name: 'Soạn thảo Word', sub: 'Phần mềm văn bản', x: 574, y: 100, color: '#2563EB', icon: 'W' },
            { name: 'Phần mềm Paint', sub: 'Vẽ hình đồ họa', x: 416, y: 186, color: '#EA580C', icon: '🎨' },
            { name: 'Trình duyệt Web', sub: 'Khám phá Internet', x: 574, y: 186, color: '#16A34A', icon: '🌐' }
        ];

        for (const app of apps) {
            drawRoundedRect(ctx, app.x, app.y, 140, 72, 10, '#FFFFFF', app.color, 2);
            drawRoundedRect(ctx, app.x + 10, app.y + 14, 38, 38, 8, app.color);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(app.icon, app.x + 29, app.y + 33);

            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 13px "Times New Roman", Arial';
            ctx.textAlign = 'left';
            ctx.fillText(app.name, app.x + 54, app.y + 28);
            ctx.fillStyle = '#475569';
            ctx.font = '11px Arial';
            ctx.fillText(app.sub, app.x + 54, app.y + 46);
        }

        drawRoundedRect(ctx, 416, 274, 298, 36, 8, '#DCFCE7', '#16A34A', 1.5);
        ctx.fillStyle = '#14532D';
        ctx.font = 'bold 13px "Times New Roman", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Phần cứng + Phần mềm phối hợp giúp máy tính hoạt động', 565, 292);
        return;
    }

    // Sơ đồ chi tiết Bộ máy tính để bàn và các bộ phận chính
    drawRoundedRect(ctx, 30, 56, 700, 270, 12, '#F8FAFC', '#0284C7', 2);
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 17px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SƠ ĐỒ CÁC BỘ PHẬN CHÍNH CỦA MÁY TÍNH ĐỂ BÀN', 380, 82);

    // Màn hình lớn ở giữa
    drawRoundedRect(ctx, 210, 98, 220, 122, 8, '#1E293B', '#0F172A', 2.5);
    drawRoundedRect(ctx, 220, 108, 200, 98, 4, '#E0F2FE');
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 15px "Times New Roman", Arial';
    ctx.fillText('MÀN HÌNH MÁY TÍNH', 320, 148);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('(Hiển thị kết quả hoạt động)', 320, 170);
    ctx.fillStyle = '#475569';
    ctx.fillRect(302, 220, 36, 16);
    ctx.fillRect(270, 236, 100, 7);
    drawBadgeLabel(ctx, '1. Màn hình', 120, 145, '#DBEAFE', '#2563EB', '#1E3A8A');

    // Thân máy bên phải
    drawRoundedRect(ctx, 480, 96, 110, 148, 8, '#334155', '#0F172A', 2.5);
    drawRoundedRect(ctx, 495, 112, 80, 16, 3, '#94A3B8');
    drawRoundedRect(ctx, 495, 136, 80, 12, 3, '#64748B');
    ctx.beginPath();
    ctx.arc(535, 205, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    drawBadgeLabel(ctx, '2. Thân máy (CPU)', 655, 165, '#DBEAFE', '#2563EB', '#1E3A8A');

    // Bàn phím phía dưới
    drawRoundedRect(ctx, 195, 255, 250, 48, 6, '#E2E8F0', '#334155', 2);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 12; c++) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(205 + c * 19, 262 + r * 12, 15, 9);
        }
    }
    drawBadgeLabel(ctx, '3. Bàn phím', 115, 280, '#DBEAFE', '#2563EB', '#1E3A8A');

    // Chuột máy tính
    drawRoundedRect(ctx, 495, 254, 54, 50, 22, '#F1F5F9', '#334155', 2);
    drawBadgeLabel(ctx, '4. Chuột máy tính', 640, 280, '#DBEAFE', '#2563EB', '#1E3A8A');
};

/**
 * Vẽ sơ đồ Quản lý Tệp và Thư mục (File Explorer)
 */
const drawFileFolderScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 35, 56, 690, 270, 10, '#FFFFFF', '#0284C7', 2);
    // Thanh tiêu đề cửa sổ File Explorer
    drawRoundedRect(ctx, 35, 56, 690, 34, 8, '#0284C7');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📁 CỬA SỐ QUẢN LÝ TỆP VÀ THƯ MỤC (FILE EXPLORER)', 52, 74);

    // Cột trái: Cây thư mục
    drawRoundedRect(ctx, 48, 102, 220, 210, 6, '#F8FAFC', '#CBD5E1', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.fillText('CÂY THƯ MỤC:', 62, 124);

    const treeItems = [
        { indent: 0, text: '💻 This PC (Máy tính)', active: false },
        { indent: 14, text: '💽 Ổ đĩa (D:)', active: false },
        { indent: 28, text: '📂 Học tập Lớp 4', active: true },
        { indent: 42, text: '📁 Môn Tin học', active: false },
        { indent: 42, text: '📁 Môn Tiếng Việt', active: false },
        { indent: 42, text: '📁 Hình ảnh minh họa', active: false }
    ];

    treeItems.forEach((item, idx) => {
        const y = 148 + idx * 26;
        if (item.active) {
            drawRoundedRect(ctx, 56, y - 14, 204, 24, 4, '#DBEAFE', '#3B82F6', 1);
        }
        ctx.fillStyle = item.active ? '#1D4ED8' : '#334155';
        ctx.font = item.active ? 'bold 13px Arial' : '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.text, 64 + item.indent, y);
    });

    // Cột phải: Các thư mục con và tệp
    drawRoundedRect(ctx, 282, 102, 430, 210, 6, '#FFFFFF', '#CBD5E1', 1.5);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.fillText('NỘI DUNG THƯ MỤC "HỌC TẬP LỚP 4":', 298, 124);

    const cards = [
        { x: 300, y: 142, label: 'Thư mục Tin học', type: 'THƯ MỤC', color: '#F59E0B', bg: '#FEF3C7' },
        { x: 435, y: 142, label: 'Thư mục Toán', type: 'THƯ MỤC', color: '#F59E0B', bg: '#FEF3C7' },
        { x: 570, y: 142, label: 'Bai_Tap_1.docx', type: 'TỆP VĂN BẢN', color: '#2563EB', bg: '#DBEAFE' },
        { x: 300, y: 226, label: 'Hinh_Ve.png', type: 'TỆP HÌNH ẢNH', color: '#16A34A', bg: '#DCFCE7' },
        { x: 435, y: 226, label: 'Thuyet_Trinh.pptx', type: 'TỆP TRÌNH CHIẾU', color: '#EA580C', bg: '#FFEDD5' },
        { x: 570, y: 226, label: 'Du_An_Scratch.sb3', type: 'TỆP CHƯƠNG TRÌNH', color: '#7C3AED', bg: '#EDE9FE' }
    ];

    cards.forEach(c => {
        drawRoundedRect(ctx, c.x, c.y, 122, 72, 8, c.bg, c.color, 1.5);
        ctx.fillStyle = c.color;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.type, c.x + 61, c.y + 24);
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12px "Times New Roman", Arial';
        ctx.fillText(c.label, c.x + 61, c.y + 48);
    });
};

/**
 * Vẽ sơ đồ Lập trình trực quan Scratch / Thuật toán
 */
const drawScratchProgrammingScene = (ctx: CanvasRenderingContext2D) => {
    drawRoundedRect(ctx, 35, 56, 690, 270, 10, '#F8FAFC', '#7C3AED', 2);
    drawRoundedRect(ctx, 35, 56, 690, 34, 8, '#7C3AED');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🧩 MÔI TRƯỜNG LẬP TRÌNH TRỰC QUAN SCRATCH & KHỐI LỆNH', 52, 74);

    // Khu vực khối lệnh bên trái
    drawRoundedRect(ctx, 48, 102, 360, 210, 8, '#FFFFFF', '#DDD6FE', 1.5);
    ctx.fillStyle = '#4C1D95';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.fillText('KỊCH BẢN KHỐI LỆNH ĐIỀU KHIỂN:', 64, 124);

    const blocks = [
        { y: 138, text: '⚑ Khi bấm vào cờ xanh (Sự kiện)', color: '#F59E0B' },
        { y: 174, text: '↻ Lặp lại 4 lần (Điều khiển)', color: '#D97706' },
        { y: 210, text: '   ➜ Di chuyển 100 bước (Chuyển động)', color: '#2563EB' },
        { y: 246, text: '   ↻ Xoay phải 90 độ (Chuyển động)', color: '#2563EB' },
        { y: 280, text: '💬 Nói "Hoàn thành!" trong 2 giây (Hiển thị)', color: '#7C3AED' }
    ];

    blocks.forEach(b => {
        drawRoundedRect(ctx, 64, b.y, 325, 28, 6, b.color);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12.5px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(b.text, 78, b.y + 15);
    });

    // Khu vực Sân khấu (Stage) bên phải
    drawRoundedRect(ctx, 424, 102, 286, 210, 8, '#FFFFFF', '#CBD5E1', 1.5);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SÂN KHẤU BIỂU DIỄN (STAGE)', 567, 124);

    drawRoundedRect(ctx, 442, 136, 250, 158, 6, '#F0FDF4', '#86EFAC', 1.5);
    // Vẽ đường đi hình vuông và nhân vật
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(485, 160, 80, 80);

    ctx.beginPath();
    ctx.arc(585, 205, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Nhân vật', 585, 205);

    drawBadgeLabel(ctx, 'Kết quả chạy chương trình', 567, 272, '#DCFCE7', '#16A34A', '#14532D');
};

/**
 * Vẽ giao diện Soạn thảo văn bản Word / Trình chiếu PowerPoint / Trình duyệt Internet
 */
const drawSoftwareApplicationScene = (ctx: CanvasRenderingContext2D, descLower: string) => {
    const isPresentation = descLower.includes('trình chiếu') || descLower.includes('powerpoint') || descLower.includes('slide');
    const isInternet = descLower.includes('internet') || descLower.includes('trình duyệt') || descLower.includes('tìm kiếm') || descLower.includes('web');

    const themeColor = isPresentation ? '#D97706' : isInternet ? '#0D9488' : '#2563EB';
    const headerTitle = isPresentation
        ? '📊 PHẦN MỀM TRÌNH CHIẾU (POWERPOINT) - THIẾT KẾ TRANG CHIẾU'
        : isInternet
            ? '🌐 TRÌNH DUYỆT INTERNET - TÌM KIẾM VÀ KHAI THÁC THÔNG TIN AN TOÀN'
            : '📝 PHẦN MỀM SOẠN THẢO VĂN BẢN (WORD) - ĐỊNH DẠNG VÀ TRÌNH BÀY';

    drawRoundedRect(ctx, 35, 56, 690, 270, 10, '#FFFFFF', themeColor, 2);
    drawRoundedRect(ctx, 35, 56, 690, 34, 8, themeColor);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText(headerTitle, 52, 74);

    // Thanh công cụ (Ribbon / Address bar)
    drawRoundedRect(ctx, 48, 98, 664, 34, 6, '#F1F5F9', '#CBD5E1', 1);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px Arial';
    if (isInternet) {
        ctx.fillText('🔍 Địa chỉ / Từ khóa tìm kiếm:  [ Nhập từ khóa thông tin bài học cần tra cứu... ]', 64, 116);
    } else {
        ctx.fillText('Phông chữ: Times New Roman  |  Cỡ chữ: 14  |  [B]  [I]  [U]  |  Căn lề  |  Chèn Hình ảnh', 64, 116);
    }

    // Vùng làm việc chính
    drawRoundedRect(ctx, 48, 142, 664, 170, 8, '#F8FAFC', '#94A3B8', 1.5);
    drawRoundedRect(ctx, 80, 154, 600, 146, 6, '#FFFFFF', '#CBD5E1', 1);

    ctx.fillStyle = themeColor;
    ctx.font = 'bold 16px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        isPresentation ? 'TIÊU ĐỀ BÀI TRÌNH CHIẾU TRỰC QUAN' : isInternet ? 'KẾT QUẢ TÌM KIẾM THÔNG TIN HỮU ÍCH' : 'TRANG SOẠN THẢO VĂN BẢN HỌC TẬP',
        380,
        182
    );

    ctx.fillStyle = '#334155';
    ctx.font = '13px "Times New Roman", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('• Nội dung được trình bày rõ ràng, khoa học, bố cục cân đối.', 110, 212);
    ctx.fillText('• Kết hợp kênh chữ và kênh hình minh họa sinh động, trực quan.', 110, 236);
    ctx.fillText('• Học sinh thực hành đúng thao tác, rèn luyện kỹ năng số an toàn.', 110, 260);
};

/**
 * Vẽ hoạt động lớp học tương tác / Thảo luận nhóm / Trò chơi khởi động / Quan sát SGK
 */
const drawClassroomPedagogicalScene = (ctx: CanvasRenderingContext2D, cleanDesc: string, lessonTitle: string) => {
    drawRoundedRect(ctx, 30, 56, 700, 270, 12, '#F0FDF4', '#0D9488', 2);

    // Bảng tương tác thông minh phía trên
    drawRoundedRect(ctx, 52, 70, 656, 125, 8, '#FFFFFF', '#0F766E', 2.5);
    drawRoundedRect(ctx, 52, 70, 656, 28, 6, '#0F766E');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px "Times New Roman", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`BẢNG TƯƠNG TÁC LỚP HỌC • ${(lessonTitle || 'BÀI HỌC').toUpperCase().slice(0, 58)}`, 380, 85);

    // Nội dung trực quan trên bảng lớp học
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px "Times New Roman", Arial';
    const boardLines = wrapCanvasText(ctx, cleanDesc, 610, 3);
    boardLines.forEach((line, idx) => {
        ctx.fillText(line, 380, 118 + idx * 22);
    });

    // 3 Nhóm hoạt động trực quan phía dưới
    const cards = [
        { x: 52, title: 'GIÁO VIÊN HƯỚNG DẪN', desc: 'Tổ chức hoạt động, nêu câu hỏi gợi mở & trình chiếu trực quan', bg: '#EFF6FF', border: '#2563EB', titleColor: '#1D4ED8' },
        { x: 278, title: 'HỌC SINH QUAN SÁT & THẢO LUẬN', desc: 'Quan sát hình SGK, trao đổi nhóm đôi / nhóm 4 sôi nổi', bg: '#FEFCE8', border: '#CA8A04', titleColor: '#A16207' },
        { x: 504, title: 'THỰC HÀNH & BÁO CÁO KẾT QUẢ', desc: 'Trình bày sản phẩm, nhận xét chéo & chốt kiến thức trọng tâm', bg: '#F0FDF4', border: '#16A34A', titleColor: '#15803D' }
    ];

    cards.forEach(c => {
        drawRoundedRect(ctx, c.x, 210, 204, 100, 8, c.bg, c.border, 1.8);
        ctx.fillStyle = c.titleColor;
        ctx.font = 'bold 12px "Times New Roman", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.title, c.x + 102, 232);

        ctx.fillStyle = '#334155';
        ctx.font = '12px "Times New Roman", Arial';
        const lines = wrapCanvasText(ctx, c.desc, 184, 3);
        lines.forEach((l, i) => {
            ctx.fillText(l, c.x + 102, 256 + i * 18);
        });
    });
};

/**
 * Tạo hình ảnh minh họa chuẩn xác (PNG Data URL) từ nội dung gợi ý hình ảnh
 */
export const renderPedagogicalIllustrationDataUrl = (
    rawLine: string,
    lessonTitle: string = ''
): string => {
    const cleanDesc = extractCleanImageDescription(rawLine);
    const cacheKey = `${lessonTitle}__${cleanDesc}`;
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

    // Nền tổng thể trắng ngà sang trọng, đóng khung chuẩn SGK
    drawRoundedRect(ctx, 2, 2, 756, 416, 14, '#FFFFFF', '#0284C7', 3);

    // Thanh Header trên cùng
    drawRoundedRect(ctx, 14, 12, 732, 34, 8, '#0369A1');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Times New Roman", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HÌNH ẢNH MINH HỌA TRỰC QUAN BÀI HỌC', 380, 29);

    const descLower = `${cleanDesc} ${lessonTitle}`.toLowerCase();

    if (
        descLower.includes('phần cứng') ||
        descLower.includes('phần mềm') ||
        descLower.includes('màn hình') ||
        descLower.includes('thân máy') ||
        descLower.includes('bàn phím') ||
        descLower.includes('chuột') ||
        descLower.includes('thiết bị') ||
        descLower.includes('máy tính để bàn')
    ) {
        drawHardwareSoftwareScene(ctx, descLower);
    } else if (
        descLower.includes('thư mục') ||
        descLower.includes('tệp') ||
        descLower.includes('ổ đĩa') ||
        descLower.includes('lưu trữ')
    ) {
        drawFileFolderScene(ctx);
    } else if (
        descLower.includes('scratch') ||
        descLower.includes('lập trình') ||
        descLower.includes('khối lệnh') ||
        descLower.includes('nhân vật') ||
        descLower.includes('thuật toán')
    ) {
        drawScratchProgrammingScene(ctx);
    } else if (
        descLower.includes('soạn thảo') ||
        descLower.includes('văn bản') ||
        descLower.includes('word') ||
        descLower.includes('trình chiếu') ||
        descLower.includes('slide') ||
        descLower.includes('powerpoint') ||
        descLower.includes('internet') ||
        descLower.includes('trình duyệt') ||
        descLower.includes('tìm kiếm')
    ) {
        drawSoftwareApplicationScene(ctx, descLower);
    } else {
        drawClassroomPedagogicalScene(ctx, cleanDesc, lessonTitle);
    }

    // Khung chú thích mô tả chính xác ở đáy hình
    drawRoundedRect(ctx, 18, 336, 724, 68, 8, '#EFF6FF', '#93C5FD', 1.5);
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'italic bold 13.5px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const captionLines = wrapCanvasText(ctx, `Hình minh họa: ${cleanDesc}`, 696, 2);
    if (captionLines.length === 1) {
        ctx.fillText(captionLines[0], 380, 370);
    } else {
        ctx.fillText(captionLines[0], 380, 358);
        ctx.fillText(captionLines[1], 380, 382);
    }

    const dataUrl = canvas.toDataURL('image/png');
    imageDataUrlCache.set(cacheKey, dataUrl);
    return dataUrl;
};
