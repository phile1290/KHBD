import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    VerticalAlign,
    Header,
    Footer,
    PageNumber,
    PageOrientation,
    PageBreak,
    TableLayoutType,
    ShadingType,
    convertMillimetersToTwip
} from "docx";
import { KhdhPlan } from "../types";

/**
 * Xây dựng nội dung các phần tử OpenXML (Paragraph, Table) cho 1 tuần Kế hoạch dạy học
 * tuân thủ nghiêm ngặt Nghị định 30/2020/NĐ-CP và mẫu 7 cột chuẩn.
 */
const buildSingleKhdhPlanElements = (plan: KhdhPlan, includeLeadingPageBreak: boolean = false): Array<Paragraph | Table> => {
    const schoolUpper = (plan.schoolName || 'TRƯỜNG TIỂU HỌC MỸ AN').toUpperCase();
    const teacherName = plan.teacherName || 'GV: Lê Văn Phi';
    const weekDisplay = String(plan.weekNumber).replace(/\D/g, '') || '1';
    const dateRangeStr = plan.dateRange || '(Từ ngày ... đến ...)';

    const elements: Array<Paragraph | Table> = [];

    if (includeLeadingPageBreak) {
        elements.push(
            new Paragraph({
                children: [new PageBreak()]
            })
        );
    }

    // 1. BẢNG ĐẦU VĂN BẢN: ĐƠN VỊ & QUỐC HIỆU THEO NGHỊ ĐỊNH 30/2020/NĐ-CP
    const noBorder = {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
    };

    const topHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: noBorder,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 30 },
                                children: [
                                    new TextRun({
                                        text: "PHÒNG GD&ĐT HUYỆN ...",
                                        font: "Times New Roman",
                                        size: 24 // 12pt
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({
                                        text: schoolUpper,
                                        font: "Times New Roman",
                                        size: 26, // 13pt
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({
                                        text: "TỔ CHUYÊN MÔN: ...................",
                                        font: "Times New Roman",
                                        size: 22 // 11pt
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 55, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: noBorder,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 30 },
                                children: [
                                    new TextRun({
                                        text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                                        font: "Times New Roman",
                                        size: 24, // 12pt
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 60 },
                                children: [
                                    new TextRun({
                                        text: "Độc lập - Tự do - Hạnh phúc",
                                        font: "Times New Roman",
                                        size: 26, // 13pt
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({
                                        text: "................., ngày ...... tháng ...... năm 2026",
                                        font: "Times New Roman",
                                        size: 22, // 11pt
                                        italics: true
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    elements.push(topHeaderTable);

    // 2. TIÊU ĐỀ KẾ HOẠCH DẠY HỌC
    elements.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 50 },
            children: [
                new TextRun({
                    text: `KẾ HOẠCH DẠY HỌC - TUẦN ${weekDisplay}`,
                    font: "Times New Roman",
                    size: 30, // 15pt
                    bold: true
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 50 },
            children: [
                new TextRun({
                    text: dateRangeStr,
                    font: "Times New Roman",
                    size: 24, // 12pt
                    italics: true
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [
                new TextRun({
                    text: "Giáo viên thực hiện: ",
                    font: "Times New Roman",
                    size: 24
                }),
                new TextRun({
                    text: teacherName,
                    font: "Times New Roman",
                    size: 24,
                    bold: true
                })
            ]
        })
    );

    // 3. BẢNG KẾ HOẠCH DẠY HỌC 7 CỘT CHUẨN
    const columnDefs = [
        { title: "Thứ, ngày", width: 14 },
        { title: "Buổi", width: 8 },
        { title: "Tiết", width: 6 },
        { title: "LỚP", width: 8 },
        { title: "MÔN", width: 10 },
        { title: "Tên bài dạy", width: 38 },
        { title: "Ghi chú", width: 16 }
    ];

    const headerRow = new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: columnDefs.map((col, idx) =>
            new TableCell({
                width: { size: col.width, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                shading: {
                    fill: "F1F5F9",
                    type: ShadingType.CLEAR,
                    color: "auto"
                },
                margins: { top: 80, bottom: 80, left: 80, right: 80 },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: idx === 0 ? 12 : 8, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: idx === columnDefs.length - 1 ? 12 : 8, color: "000000" }
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: col.title,
                                font: "Times New Roman",
                                size: 24, // 12pt
                                bold: true
                            })
                        ]
                    })
                ]
            })
        )
    });

    const dataRows = (plan.rows || []).map((row, rowIdx) => {
        const isLastRow = rowIdx === (plan.rows || []).length - 1;
        const noteText = (row.notes || '').trim();
        const bottomBorderSize = isLastRow ? 12 : 6;

        const cellBorder = (colIdx: number) => ({
            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: bottomBorderSize, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: colIdx === 0 ? 12 : 6, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: colIdx === 6 ? 12 : 6, color: "000000" }
        });

        return new TableRow({
            cantSplit: true,
            children: [
                // 1. Thứ, ngày
                new TableCell({
                    width: { size: 14, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                    borders: cellBorder(0),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: String(row.dayAndDate || row.dayOfWeek || ''),
                                    font: "Times New Roman",
                                    size: 23, // 11.5pt
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                // 2. Buổi
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                    borders: cellBorder(1),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: String(row.session || ''),
                                    font: "Times New Roman",
                                    size: 23
                                })
                            ]
                        })
                    ]
                }),
                // 3. Tiết
                new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                    borders: cellBorder(2),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: String(row.period || row.periodNumber || ''),
                                    font: "Times New Roman",
                                    size: 24,
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                // 4. LỚP
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                    borders: cellBorder(3),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: String(row.className || row.grade || ''),
                                    font: "Times New Roman",
                                    size: 24,
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                // 5. MÔN
                new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 60, right: 60 },
                    borders: cellBorder(4),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: String(row.subject || ''),
                                    font: "Times New Roman",
                                    size: 24,
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                // 6. Tên bài dạy
                new TableCell({
                    width: { size: 38, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    borders: cellBorder(5),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                new TextRun({
                                    text: String(row.lessonName || ''),
                                    font: "Times New Roman",
                                    size: 24
                                })
                            ]
                        })
                    ]
                }),
                // 7. Ghi chú
                new TableCell({
                    width: { size: 16, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 80, right: 80 },
                    borders: cellBorder(6),
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                new TextRun({
                                    text: noteText,
                                    font: "Times New Roman",
                                    size: 22, // 11pt
                                    italics: !!noteText,
                                    color: noteText ? "0F766E" : "000000"
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    });

    const khdhTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" }
        },
        rows: [headerRow, ...dataRows]
    });

    elements.push(khdhTable);

    // 4. BẢNG CHỮ KÝ DUYỆT THEO NGHỊ ĐỊNH 30
    elements.push(
        new Paragraph({
            spacing: { before: 160, after: 40 },
            children: []
        })
    );

    const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: noBorder,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "DUYỆT CỦA BGH",
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [
                                    new TextRun({
                                        text: "(Ký và ghi rõ họ tên)",
                                        font: "Times New Roman",
                                        size: 22,
                                        italics: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "........................................",
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: noBorder,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "TỔ TRƯỞNG CHUYÊN MÔN",
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [
                                    new TextRun({
                                        text: "(Ký và ghi rõ họ tên)",
                                        font: "Times New Roman",
                                        size: 22,
                                        italics: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "........................................",
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: noBorder,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: "NGƯỜI LẬP KẾ HOẠCH",
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [
                                    new TextRun({
                                        text: "(Ký và ghi rõ họ tên)",
                                        font: "Times New Roman",
                                        size: 22,
                                        italics: true
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: teacherName,
                                        font: "Times New Roman",
                                        size: 24,
                                        bold: true
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    elements.push(signatureTable);

    return elements;
};

const createKhdhDocumentFromPlans = (plans: KhdhPlan[]): Document => {
    const firstPlan = plans[0];
    const isLandscape = firstPlan?.layoutOrientation === 'landscape';
    const schoolName = firstPlan?.schoolName || 'Trường Tiểu học Mỹ An';
    const teacherName = firstPlan?.teacherName || 'GV: Lê Văn Phi';

    const allChildren: Array<Paragraph | Table> = [];
    plans.forEach((plan, idx) => {
        const planElements = buildSingleKhdhPlanElements(plan, idx > 0);
        allChildren.push(...planElements);
    });

    const footerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { top: 60, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: schoolName,
                                        font: "Times New Roman",
                                        size: 20, // 10pt
                                        italics: true,
                                        color: "0F766E"
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { top: 60, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        text: teacherName,
                                        font: "Times New Roman",
                                        size: 20, // 10pt
                                        italics: true,
                                        color: "0F766E"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    return new Document({
        sections: [
            {
                properties: {
                    titlePage: true,
                    page: {
                        size: {
                            width: convertMillimetersToTwip(210),
                            height: convertMillimetersToTwip(297),
                            orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
                        },
                        margin: {
                            top: convertMillimetersToTwip(20),
                            bottom: convertMillimetersToTwip(20),
                            left: convertMillimetersToTwip(30),
                            right: convertMillimetersToTwip(15),
                            header: convertMillimetersToTwip(12),
                            footer: convertMillimetersToTwip(12)
                        }
                    }
                },
                headers: {
                    first: new Header({
                        children: []
                    }),
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        font: "Times New Roman",
                                        size: 26
                                    })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    first: new Footer({
                        children: [footerTable]
                    }),
                    default: new Footer({
                        children: [footerTable]
                    })
                },
                children: allChildren
            }
        ]
    });
};

/**
 * Sinh Blob chuẩn OpenXML (.docx) cho 1 tuần Kế hoạch dạy học
 */
export const generateKhdhDocxBlob = async (plan: KhdhPlan): Promise<Blob> => {
    const doc = createKhdhDocumentFromPlans([plan]);
    return await Packer.toBlob(doc);
};

/**
 * Tải file Word chuẩn OpenXML (.docx) cho 1 tuần Kế hoạch dạy học
 */
export const exportKhdhToWord = async (plan: KhdhPlan, customFileName?: string) => {
    try {
        const weekDisplay = String(plan.weekNumber).replace(/\D/g, '') || '1';
        const blob = await generateKhdhDocxBlob(plan);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (customFileName || `Ke_Hoach_Day_Hoc_Tuan_${weekDisplay}`)
            .replace(/[\/\\?%*:|"<>]/g, '_')
            .replace(/\.docx?$/i, '');
        link.href = url;
        link.download = `${safeName}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Lỗi khi xuất file Word (.docx) KHDH:', error);
        alert('Có lỗi xảy ra khi xuất file Word (.docx): ' + error.message);
    }
};

/**
 * Xuất TẤT CẢ các tuần Kế hoạch dạy học vào chung 1 file Word (.docx) tổng hợp (ngắt trang chuẩn giữa các tuần)
 */
export const exportAllKhdhToSingleWord = async (plans: KhdhPlan[], customFileName?: string) => {
    if (!plans || plans.length === 0) return;

    try {
        const doc = createKhdhDocumentFromPlans(plans);
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (customFileName || `Ke_Hoach_Day_Hoc_Tron_Bo_${plans.length}_Tuan`)
            .replace(/[\/\\?%*:|"<>]/g, '_')
            .replace(/\.docx?$/i, '');
        link.href = url;
        link.download = `${safeName}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Lỗi khi xuất file Word (.docx) tổng hợp KHDH:', error);
        alert('Có lỗi xảy ra khi xuất file Word (.docx): ' + error.message);
    }
};
