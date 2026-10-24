import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
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
    PageBreak,
    TableLayoutType,
    convertMillimetersToTwip
} from 'docx';
import { LessonPlanResponse, Period, Activity } from './types';
import {
    isImageHintLine,
    renderPedagogicalIllustrationDataUrl,
    dataUrlToUint8Array
} from './utils/lessonImageGenerator';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result?.toString();
            if (result) {
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const formatActivityName = (name: string): string => {
    const cleanName = (name || '').trim();
    const lower = cleanName.toLowerCase();

    if (lower.includes("mở đầu") || lower.includes("khởi động") || /^1[\.\)]/.test(lower)) {
        return "1. Hoạt động mở đầu";
    }
    if (lower.includes("kiến thức") || lower.includes("khám phá") || lower.includes("hình thành") || /^2[\.\)]/.test(lower)) {
        return "2. Hoạt động hình thành kiến thức mới";
    }
    if (lower.includes("luyện tập") || lower.includes("thực hành") || /^3[\.\)]/.test(lower)) {
        return "3. Hoạt động luyện tập, thực hành";
    }
    if (lower.includes("vận dụng") || lower.includes("trải nghiệm") || lower.includes("mở rộng") || /^4[\.\)]/.test(lower)) {
        return "4. Hoạt động vận dụng, trải nghiệm";
    }

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

export const formatTopicName = (topic: string): string => {
    let text = (topic || '').trim();
    text = text.replace(/<\/?u>/g, '').replace(/<\/?b>/g, '').replace(/\*\*/g, '');
    text = text.replace(/^([\d\w]+[\.\/])\s*/, '* ');
    if (!text.startsWith('*') && text.length > 0) text = '* ' + text;
    return text;
};

export const extractBaseLessonName = (rawName: string): string => {
    let name = (rawName || '').trim();
    name = name.replace(/\s*\(\s*\d+\s*phút\s*\)/gi, '').trim();
    name = name.replace(/[\(\[\-–—:\.]*\s*tiết\s*\d+(\s*(và|&|\-|\–|—|\/|,|trên)\s*\d+)*\s*[\)\]]*/gi, ' ');
    name = name.replace(/[\(\[\-–—:\.]*\s*(tiết\s*)?(tiếp\s*theo|tt)\s*[\)\]]*/gi, ' ');
    name = name.replace(/^tiết\s*\d+[\s:–\-\.]*/gi, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.replace(/^[\-–—:\.,]\s*/, '').replace(/[\-–—:\.,]\s*$/, '').trim();
    return name || (rawName || '').trim();
};

export const extractExplicitPeriodNumber = (rawName: string): number | null => {
    const match = (rawName || '').match(/[\(\[\-–—:\.]*\s*tiết\s*(\d+)(?:\s*(?:\/|trên|-|–)\s*\d+)?\s*[\)\]]*/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return null;
};

export const formatLessonTitleWithPeriod = (rawTitle: string, periodNum: number | string): string => {
    const title = extractBaseLessonName(rawTitle || '');
    const pNum = String(periodNum || '1').trim();
    return `${title} (TIẾT ${pNum})`;
};

/**
 * Đảm bảo tuyệt đối 100%:
 * - Mỗi tuần chỉ soạn đúng 1 tiết học (periods.length === 1), gắn đúng số thứ tự tiết của bài học (VD: Tiết 2 khi là Tiết 2/2).
 * - Mỗi tiết học (Period) trong Kế hoạch bài dạy luôn có ĐẦY ĐỦ 4 HOẠT ĐỘNG DẠY HỌC
 *   theo đúng chuẩn Công văn 2345/BGDĐT-GDTH:
 *   1. Hoạt động mở đầu
 *   2. Hoạt động hình thành kiến thức mới
 *   3. Hoạt động luyện tập, thực hành
 *   4. Hoạt động vận dụng, trải nghiệm
 */
export const ensureFourActivitiesInAllPeriods = (
    response: LessonPlanResponse,
    inputData?: any
): LessonPlanResponse => {
    if (!response || !Array.isArray(response.periods)) {
        return response;
    }

    const rawTitleSource = inputData?.baseLessonName || inputData?.lessonName || response.lesson_full_title || 'bài học';
    const baseTitle = extractBaseLessonName(rawTitleSource);

    // Xác định chính xác tiết thứ mấy của bài học trong tuần này
    const explicitPeriodFromInput =
        Number(inputData?.periodIndexInLesson) ||
        extractExplicitPeriodNumber(inputData?.lessonName || '') ||
        extractExplicitPeriodNumber(response.lesson_full_title || '') ||
        null;

    // Mỗi tuần chỉ có 1 tiết học. Nếu AI lỡ trả về nhiều hơn 1 tiết cho 1 tuần, chọn đúng tiết tương ứng với periodIndexInLesson
    let sourcePeriods = response.periods;
    if (sourcePeriods.length > 1) {
        const targetPeriodNum = explicitPeriodFromInput || 1;
        const matchedPeriod = sourcePeriods.find(p => Number(p.period_number) === targetPeriodNum);
        sourcePeriods = [matchedPeriod || sourcePeriods[Math.min(targetPeriodNum - 1, sourcePeriods.length - 1)] || sourcePeriods[0]];
    }

    const canonicalSpecs: Array<{
        index: number;
        name: string;
        defaultTime: string;
        buildFallback: (periodNum: number) => Activity;
    }> = [
        {
            index: 1,
            name: "1. Hoạt động mở đầu",
            defaultTime: "5'",
            buildFallback: (periodNum: number) => ({
                name: "1. Hoạt động mở đầu",
                time: "5'",
                rows: [
                    {
                        teacher: periodNum > 1
                            ? `- Tổ chức trò chơi khởi động kết nối kiến thức đã học ở tiết trước với nội dung tiếp theo của bài "${baseTitle}".\n- Đặt câu hỏi gợi mở để HS chia sẻ hiểu biết hoặc trải nghiệm thực tế liên quan đến bài học.`
                            : `- Tạo không khí vui tươi, phấn khởi trước khi vào tiết học.\n- Tổ chức tình huống khởi động gắn với thực tiễn để dẫn dắt vào bài học "${baseTitle}".`,
                        student: periodNum > 1
                            ? `- HS hào hứng tham gia trò chơi khởi động và ôn lại kiến thức tiết trước.\n- HS suy nghĩ, trả lời câu hỏi gợi mở của GV.`
                            : `- HS tham gia hoạt động khởi động với tinh thần sôi nổi, tích cực.\n- HS quan sát tình huống và chia sẻ ý kiến cá nhân.`
                    },
                    {
                        teacher: `- Nhận xét, tuyên dương tinh thần học tập của HS và giới thiệu trực tiếp vào nội dung bài học mới.\n- Ghi tên bài học lên bảng.`,
                        student: `- HS lắng nghe, mở SGK và ghi tên bài học vào vở.`
                    }
                ]
            })
        },
        {
            index: 2,
            name: "2. Hoạt động hình thành kiến thức mới",
            defaultTime: "15'",
            buildFallback: () => ({
                name: "2. Hoạt động hình thành kiến thức mới",
                time: "15'",
                topic: `* Tìm hiểu nội dung trọng tâm của bài học`,
                rows: [
                    {
                        teacher: `- Yêu cầu HS quan sát kênh hình, đọc thông tin trong SGK của bài "${baseTitle}" và thảo luận nhóm đôi để trả lời câu hỏi tìm hiểu bài.\n[Gợi ý hình ảnh: Hình ảnh minh họa nội dung khám phá kiến thức mới của bài ${baseTitle} trong SGK]`,
                        student: `- HS quan sát hình minh họa, đọc thông tin trong SGK và thảo luận nhóm đôi theo yêu cầu.`
                    },
                    {
                        teacher: `- Mời đại diện một số nhóm trình bày kết quả tìm hiểu trước lớp.\n- Tổ chức cho các nhóm khác nhận xét, bổ sung và đặt câu hỏi phản biện.`,
                        student: `- Đại diện nhóm trình bày kết quả thảo luận.\n- Các nhóm khác lắng nghe, nhận xét và bổ sung ý kiến.`
                    },
                    {
                        teacher: `- Nhận xét, phân tích làm rõ kiến thức trọng tâm và chốt lại nội dung ghi nhớ của bài học.`,
                        student: `- HS lắng nghe, ghi nhớ kiến thức cốt lõi của bài học.`
                    }
                ]
            })
        },
        {
            index: 3,
            name: "3. Hoạt động luyện tập, thực hành",
            defaultTime: "10'",
            buildFallback: () => ({
                name: "3. Hoạt động luyện tập, thực hành",
                time: "10'",
                topic: `* Thực hành, luyện tập củng cố kiến thức`,
                rows: [
                    {
                        teacher: `- Giao nhiệm vụ cho HS thực hiện các bài tập/hoạt động thực hành trong SGK của bài "${baseTitle}".\n- Hướng dẫn tiêu chí thực hiện và quan sát, hỗ trợ kịp thời những HS gặp khó khăn.`,
                        student: `- HS đọc kỹ yêu cầu bài tập trong SGK.\n- Thực hiện nhiệm vụ luyện tập, thực hành cá nhân hoặc theo nhóm.`
                    },
                    {
                        teacher: `- Tổ chức cho HS trình bày sản phẩm thực hành hoặc kết quả làm bài trước lớp.\n- Tổ chức cho HS nhận xét chéo và đánh giá kết quả thực hiện.`,
                        student: `- Đại diện HS trình bày kết quả bài tập/thao tác thực hành.\n- HS lớp nhận xét, đối chiếu và tự điều chỉnh bài làm.`
                    },
                    {
                        teacher: `- Nhận xét, tuyên dương các cá nhân/nhóm thực hiện tốt và khắc sâu kỹ năng trọng tâm.`,
                        student: `- HS lắng nghe nhận xét của GV và hoàn thiện bài làm.`
                    }
                ]
            })
        },
        {
            index: 4,
            name: "4. Hoạt động vận dụng, trải nghiệm",
            defaultTime: "5'",
            buildFallback: () => ({
                name: "4. Hoạt động vận dụng, trải nghiệm",
                time: "5'",
                rows: [
                    {
                        teacher: `- Nêu câu hỏi/tình huống vận dụng thực tiễn để HS liên hệ kiến thức vừa học trong bài "${baseTitle}" vào cuộc sống hằng ngày.\n- Khuyến khích HS chia sẻ cách xử lý tình huống hoặc ý tưởng sáng tạo của bản thân.`,
                        student: `- HS suy nghĩ, liên hệ thực tế và chia sẻ cách vận dụng kiến thức đã học vào cuộc sống.\n- Lắng nghe và góp ý cho phần chia sẻ của bạn.`
                    },
                    {
                        teacher: `- Nhận xét chung tiết học, biểu dương các cá nhân và nhóm học tập tích cực.\n- Dặn dò HS thực hành vận dụng tại nhà và chuẩn bị cho tiết học tiếp theo.`,
                        student: `- HS lắng nghe, tự đánh giá kết quả học tập và ghi nhớ nội dung dặn dò của GV.`
                    }
                ]
            })
        }
    ];

    const updatedPeriods: Period[] = sourcePeriods.map((period, pIdx) => {
        const resolvedPeriodNum = explicitPeriodFromInput || Number(period.period_number) || (pIdx + 1);
        const rawActivities = Array.isArray(period.activities) ? period.activities : [];

        const buckets: Map<number, Activity[]> = new Map([
            [1, []],
            [2, []],
            [3, []],
            [4, []]
        ]);

        rawActivities.forEach((act, idx) => {
            if (!act) return;
            const formatted = formatActivityName(act.name || '');
            let bucketIdx = 0;
            if (formatted.startsWith('1.')) bucketIdx = 1;
            else if (formatted.startsWith('2.')) bucketIdx = 2;
            else if (formatted.startsWith('3.')) bucketIdx = 3;
            else if (formatted.startsWith('4.')) bucketIdx = 4;
            else if (idx < 4 && (buckets.get(idx + 1)?.length || 0) === 0) {
                bucketIdx = idx + 1;
            } else {
                bucketIdx = 2;
            }

            const validRows = (act.rows || []).filter(
                r => r && ((r.teacher && r.teacher.trim()) || (r.student && r.student.trim()))
            );
            if (validRows.length > 0) {
                buckets.get(bucketIdx)?.push({
                    ...act,
                    name: canonicalSpecs[bucketIdx - 1].name,
                    rows: validRows
                });
            }
        });

        const finalActivities: Activity[] = canonicalSpecs.map(spec => {
            const matchedList = buckets.get(spec.index) || [];
            if (matchedList.length === 0) {
                return spec.buildFallback(resolvedPeriodNum);
            }
            if (matchedList.length === 1) {
                const single = matchedList[0];
                return {
                    name: spec.name,
                    time: (single.time || spec.defaultTime).trim(),
                    topic: single.topic,
                    rows: single.rows
                };
            }
            const mergedRows: Array<{ teacher: string; student: string }> = [];
            matchedList.forEach((item, mIdx) => {
                if (mIdx > 0 && item.topic) {
                    const topicLine = formatTopicName(item.topic);
                    const itemRows = [...(item.rows || [])];
                    if (itemRows.length > 0) {
                        itemRows[0] = {
                            teacher: `${topicLine}\n${itemRows[0].teacher || ''}`.trim(),
                            student: itemRows[0].student || ''
                        };
                    }
                    mergedRows.push(...itemRows);
                } else {
                    mergedRows.push(...(item.rows || []));
                }
            });

            return {
                name: spec.name,
                time: (matchedList[0].time || spec.defaultTime).trim(),
                topic: matchedList[0].topic,
                rows: mergedRows
            };
        });

        return {
            ...period,
            period_number: resolvedPeriodNum,
            activities: finalActivities
        };
    });

    const finalPeriodNum = updatedPeriods[0]?.period_number || explicitPeriodFromInput || 1;
    const updatedFullTitle = formatLessonTitleWithPeriod(baseTitle, finalPeriodNum);

    return {
        ...response,
        lesson_full_title: updatedFullTitle,
        periods: updatedPeriods
    };
};

export const sanitizeAndParseJSON = (text: string): LessonPlanResponse => {
    try {
        const firstBrace = text.indexOf('{');

        if (firstBrace === -1) {
            throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi.");
        }

        let braceCount = 0;
        let lastBrace = -1;

        for (let i = firstBrace; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    lastBrace = i;
                    break;
                }
            }
        }

        if (lastBrace === -1) {
            throw new Error("JSON không hoàn chỉnh (thiếu dấu ngoặc).");
        }

        let jsonString = text.substring(firstBrace, lastBrace + 1);
        jsonString = jsonString
            .replace(/```json/g, '')
            .replace(/```/g, '')
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

        const parsed: LessonPlanResponse = JSON.parse(jsonString);
        return ensureFourActivitiesInAllPeriods(parsed);
    } catch (e) {
        console.error("JSON Parse Error Raw Text:" + text);
        throw e;
    }
};

export const cleanPrefix = (text: string | null | undefined): string => {
    if (!text) return "";
    let cleaned = text.replace(/^[-–\*\s]*(GV|Giáo viên|HS|Học sinh|Thầy|Cô)\s*[:\.]\s*/gim, '- ');
    cleaned = cleaned.replace(/^-\s*-\s*/gm, '- ');
    return cleaned;
};

/**
 * Căn chỉnh từng cặp hành động của Giáo viên và Học sinh 1:1 ngang hàng,
 * đồng thời tách các dòng hình ảnh minh họa thành dòng riêng ngay dưới ý lệnh GV
 * để Word ngắt trang sát mép 2.2cm và không làm lệch hàng các ý lệnh kế tiếp.
 */
export const alignContent = (teacherText: string, studentText: string) => {
    const rawTLines = cleanPrefix(teacherText || '')
        .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:)/gi, '\n$1')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const rawSLines = cleanPrefix(studentText || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const tGroups: Array<{ text: string; images: string[] }> = [];
    const leadingImages: string[] = [];

    for (const line of rawTLines) {
        if (isImageHintLine(line)) {
            const cleanHint = line.replace(/^[-–\*\s]+/, '').trim();
            if (tGroups.length > 0) {
                tGroups[tGroups.length - 1].images.push(cleanHint);
            } else {
                leadingImages.push(cleanHint);
            }
        } else {
            tGroups.push({ text: line, images: [] });
        }
    }

    const alignedRows: Array<{ teacher: string; student: string }> = [];

    for (const imgLine of leadingImages) {
        alignedRows.push({
            teacher: imgLine,
            student: ''
        });
    }

    const maxLen = Math.max(tGroups.length, rawSLines.length);
    for (let i = 0; i < maxLen; i++) {
        const tItem = tGroups[i];
        const sLine = rawSLines[i] || '';
        if (tItem || sLine) {
            alignedRows.push({
                teacher: tItem ? tItem.text : '',
                student: sLine
            });
        }
        if (tItem && tItem.images.length > 0) {
            for (const imgLine of tItem.images) {
                alignedRows.push({
                    teacher: imgLine,
                    student: ''
                });
            }
        }
    }

    return alignedRows;
};

export interface FormattedObjective {
    text: string;
    isIntegration: boolean;
}

export const formatObjectives = (objectives: string[] | undefined | null): FormattedObjective[] => {
    if (!Array.isArray(objectives)) return [];

    const result: FormattedObjective[] = [];

    const processLine = (rawLine: string) => {
        let line = (rawLine || '')
            .replace(/\*\*/g, '')
            .replace(/<\/?i>/gi, '')
            .replace(/<\/?em>/gi, '')
            .replace(/<\/?b>/gi, '')
            .trim();

        if (!line) return;

        const isIntegration = /tích\s*hợp|\bkns\b|kỹ\s*năng\s*sống|\bai\b|trí\s*tuệ\s*nhân\s*tạo|năng\s*lực\s*số|\bnls\b|\bstem\b|gdqpan/i.test(line);

        if (isIntegration) {
            let text = line.replace(/^[1-9]\s*[\.\:\)\-–]\s*/, '');
            text = text.replace(/^[-–\*\s]+/, '').trim();
            text = text.replace(/^tích\s*hợp\s*[:\-\.]\s*/i, '');
            text = text.replace(/^[-–\*\s]+/, '').trim();

            if (/^(kns|kỹ\s*năng\s*sống)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i.test(text)) {
                text = text.replace(/^(kns|kỹ\s*năng\s*sống)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i, '');
                text = `- Tích hợp KNS: ${text.trim()}`;
            } else if (/^(ai|trí\s*tuệ\s*nhân\s*tạo|năng\s*lực\s*ai)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i.test(text)) {
                text = text.replace(/^(ai|trí\s*tuệ\s*nhân\s*tạo|năng\s*lực\s*ai)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i, '');
                text = `- Tích hợp AI: ${text.trim()}`;
            } else if (/^(năng\s*lực\s*số|nls)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i.test(text)) {
                text = text.replace(/^(năng\s*lực\s*số|nls)(\s*\([^)]*\))?\s*[:\-\–\.]\s*/i, '');
                text = `- Tích hợp Năng lực số: ${text.trim()}`;
            } else if (/^tích\s*hợp\s+([^:]+)[:\-\–]\s*(.*)$/i.test(text)) {
                const match = text.match(/^tích\s*hợp\s+([^:]+)[:\-\–]\s*(.*)$/i);
                if (match) {
                    const domain = match[1].trim();
                    const content = match[2].trim();
                    text = `- Tích hợp ${domain}: ${content}`;
                } else {
                    text = `- Tích hợp: ${text}`;
                }
            } else {
                text = text.replace(/^tích\s*hợp\s*[:\-\–]?\s*/i, '');
                text = `- Tích hợp: ${text.trim()}`;
            }

            result.push({
                text,
                isIntegration: true
            });
        } else {
            let text = line.replace(/^[1-9]\s*[\.\:\)\-–]\s*/, '');
            text = text.replace(/^[-–\*\s]+/, '').trim();

            text = text.replace(/^(về\s+)?(kiến\s*thức(\s*,\s*kỹ\s*năng|\s+và\s+kỹ\s*năng)?|kỹ\s*năng|năng\s*lực(\s+chung|\s+đặc\s+thù)?|phẩm\s*chất(\s+chủ\s+yếu)?)\s*[:\-\–\.]\s*/i, '');
            text = text.replace(/^[:\-\–\*\s]+/, '').trim();

            if (text) {
                const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
                result.push({
                    text: `- ${capitalized}`,
                    isIntegration: false
                });
            }
        }
    };

    objectives.forEach(item => {
        if (!item) return;
        const lines = item.split(/\r?\n/);
        lines.forEach(l => {
            const trimmed = l.trim();
            if (trimmed) {
                processLine(trimmed);
            }
        });
    });

    return result;
};

export const formatGradeHeader = (val?: string) => {
    const v = (val || '').trim();
    if (!v) return 'LỚP 5';
    const upper = v.toUpperCase();
    if (upper.startsWith('LỚP')) return upper;
    return `LỚP ${upper}`;
};

export const formatSubjectHeader = (val?: string) => {
    const v = (val || '').trim();
    if (!v) return 'MÔN HỌC';
    const upper = v.toUpperCase();
    if (upper.startsWith('MÔN HỌC:')) return upper;
    if (upper.startsWith('MÔN HỌC')) return `MÔN HỌC: ${upper.replace(/^MÔN HỌC\s*/, '')}`;
    if (upper.startsWith('MÔN:')) return `MÔN HỌC: ${upper.replace(/^MÔN:\s*/, '')}`;
    if (upper.startsWith('MÔN')) return `MÔN HỌC: ${upper.replace(/^MÔN\s*/, '')}`;
    return `MÔN HỌC: ${upper}`;
};

export interface PaginatedActivitySubRow {
    key?: string;
    timeText: string;
    isFirstRowOfActivity: boolean;
    isLastRowOfActivity: boolean;
    formattedActName: string;
    formattedTopic: string;
    teacherRaw: string;
    studentRaw: string;
    teacherFormatted: string;
    studentFormatted: string;
}

export const paginateActivityRowsForWordPages = <T extends {
    isFirstRowOfActivity: boolean;
    formattedActName?: string;
    formattedTopic?: string;
    topic?: string;
    teacherRaw?: string;
    studentRaw?: string;
    teacher?: string;
    student?: string;
}>(
    flatRows: T[],
    objectivesCount: number = 4,
    teacherMatLen: number = 60,
    studentMatLen: number = 60
): T[][] => {
    if (!flatRows || flatRows.length === 0) return [];

    const countWrappedLines = (text: string, charsPerLine: number): number => {
        if (!text) return 0;
        const paragraphs = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (paragraphs.length === 0) return 0;
        return paragraphs.reduce((acc, p) => {
            if (isImageHintLine(p)) {
                return acc + 5.5;
            }
            return acc + Math.max(1, Math.ceil(p.length / charsPerLine));
        }, 0);
    };

    const estimateRowHeightPt = (row: T): number => {
        const tText = row.teacherRaw ?? row.teacher ?? '';
        const sText = row.studentRaw ?? row.student ?? '';
        const hasTopic = !!(row.formattedTopic || row.topic);

        let gvLines = countWrappedLines(tText, 44);
        let hsLines = countWrappedLines(sText, 32);

        if (row.isFirstRowOfActivity) {
            gvLines += 1.1;
            hsLines += 1.0;
            if (hasTopic) {
                gvLines += Math.max(1.1, Math.ceil(String(row.formattedTopic || row.topic || '').length / 42));
                hsLines += 1.0;
            }
        }

        const maxLines = Math.max(1, gvLines, hsLines);
        return maxLines * 17 + 8;
    };

    const objHeightPt = Math.max(3, objectivesCount) * 20 + 24;
    const matHeightPt = (Math.ceil(teacherMatLen / 70) + Math.ceil(studentMatLen / 70)) * 18 + 28;
    const titleAndSectionHeadersPt = 92 + 24 + 30;
    const introHeightOnPage1Pt = titleAndSectionHeadersPt + objHeightPt + matHeightPt;

    // Khổ A4 cao 842pt, lề trên 2.0cm (~57pt), lề dưới đến đáy khung bảng 2.2cm (~62pt) -> vùng thân trang ~723pt
    const SAFE_PAGE_TOTAL_PT = 675;
    const page1MaxTableBodyPt = Math.max(240, SAFE_PAGE_TOTAL_PT - introHeightOnPage1Pt);
    const subsequentPageMaxTableBodyPt = SAFE_PAGE_TOTAL_PT - 32;

    const pages: T[][] = [];
    let currentPageRows: T[] = [];
    let currentHeightPt = 0;
    let isFirstPage = true;

    for (let i = 0; i < flatRows.length; i++) {
        const row = flatRows[i];
        const rowH = estimateRowHeightPt(row);
        const maxAllowedPt = isFirstPage ? page1MaxTableBodyPt : subsequentPageMaxTableBodyPt;

        if (currentPageRows.length > 0 && (currentHeightPt + rowH > maxAllowedPt)) {
            pages.push(currentPageRows);
            currentPageRows = [row];
            currentHeightPt = rowH;
            isFirstPage = false;
        } else {
            currentPageRows.push(row);
            currentHeightPt += rowH;
        }
    }

    if (currentPageRows.length > 0) {
        pages.push(currentPageRows);
    }

    return pages;
};

/**
 * Chuyển đổi văn bản trong ô Hoạt động của GV / HS thành danh sách Paragraph chuẩn OpenXML (.docx)
 * - Thay thế hoàn toàn [Gợi ý hình ảnh: ...] bằng hình ảnh thực tế (ImageRun) nhúng thẳng vào tài liệu Word.
 * - Tô màu xanh cổ vịt in nghiêng đậm cho [Tích hợp]: ...
 */
const buildCellParagraphsFromText = (
    rawText: string,
    extraHeaderLines: string[] = [],
    blankSpacerCount: number = 0,
    lessonTitle: string = ''
): Paragraph[] => {
    const paragraphs: Paragraph[] = [];

    for (const headerLine of extraHeaderLines) {
        if (!headerLine) continue;
        paragraphs.push(
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 15, after: 25, line: 264 },
                children: [
                    new TextRun({
                        text: headerLine,
                        font: "Times New Roman",
                        size: 26, // 13pt
                        bold: true,
                        color: "000000"
                    })
                ]
            })
        );
    }

    for (let i = 0; i < blankSpacerCount; i++) {
        paragraphs.push(
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 15, after: 25, line: 264 },
                children: [
                    new TextRun({
                        text: "",
                        font: "Times New Roman",
                        size: 26
                    })
                ]
            })
        );
    }

    const lines = (rawText || '')
        .split('\n')
        .map(l => l.replace(/\*\*/g, '').trim())
        .filter(Boolean);

    if (lines.length === 0 && paragraphs.length === 0) {
        paragraphs.push(
            new Paragraph({
                spacing: { before: 10, after: 20, line: 264 },
                children: [new TextRun({ text: "", font: "Times New Roman", size: 26 })]
            })
        );
        return paragraphs;
    }

    for (const line of lines) {
        if (isImageHintLine(line)) {
            const dataUrl = renderPedagogicalIllustrationDataUrl(line, lessonTitle);
            if (dataUrl) {
                const imgBytes = dataUrlToUint8Array(dataUrl);
                paragraphs.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40, after: 40 },
                        children: [
                            new ImageRun({
                                data: imgBytes,
                                transformation: {
                                    width: 260,
                                    height: 144
                                },
                                type: "png"
                            })
                        ]
                    })
                );
            }
        } else if (/^(\[Tích hợp\]|-\s*Tích hợp)/i.test(line)) {
            paragraphs.push(
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { before: 15, after: 25, line: 264 },
                    children: [
                        new TextRun({
                            text: line,
                            font: "Times New Roman",
                            size: 26,
                            bold: true,
                            italics: true,
                            color: "0D9488"
                        })
                    ]
                })
            );
        } else {
            paragraphs.push(
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { before: 15, after: 25, line: 264 },
                    children: [
                        new TextRun({
                            text: line,
                            font: "Times New Roman",
                            size: 26,
                            color: "000000"
                        })
                    ]
                })
            );
        }
    }

    return paragraphs;
};

/**
 * Tạo file Word chuẩn OpenXML (.docx) cho Kế hoạch bài dạy (KHBD)
 * - Mở trực tiếp ở chế độ Print Layout trong Microsoft Word.
 * - Đóng khung đường kẻ ngang ở CUỐI MỖI TRANG WORD trong bảng "III. CÁC HOẠT ĐỘNG DẠY HỌC"
 *   với khoảng cách từ mép dưới trang giấy đến đường kẻ khung cuối trang đúng chuẩn 2.2cm (22mm).
 * - Thay thế toàn bộ gợi ý hình ảnh bằng hình ảnh minh họa thực tế nhúng trong bảng.
 * - Hiển thị chính xác tuyệt đối số thứ tự tiết học sau tên bài dạy (VD: (TIẾT 2) đối với Tiết 2/2).
 */
export const generateLessonPlanDocxBlob = async (
    rawResult: LessonPlanResponse,
    inputData: any
): Promise<Blob> => {
    const result = ensureFourActivitiesInAllPeriods(rawResult, inputData);

    const displayGrade = inputData?.grade || result.grade_class || '5';
    const displaySubject = inputData?.subject || result.subject || 'TIN HỌC';
    const displaySchool = inputData?.schoolName || 'Trường Tiểu học Mỹ An';
    const displayTeacher = inputData?.teacherName || 'GV: Lê Văn Phi';

    const children: Array<Paragraph | Table> = [];
    const periods = result.periods || [];

    periods.forEach((period, periodIdx) => {
        const periodNum =
            Number(inputData?.periodIndexInLesson) ||
            Number(period.period_number) ||
            extractExplicitPeriodNumber(inputData?.lessonName || '') ||
            extractExplicitPeriodNumber(result.lesson_full_title || '') ||
            (periodIdx + 1);

        const rawTitleSource =
            inputData?.baseLessonName ||
            inputData?.lessonName ||
            result.lesson_full_title ||
            "KẾ HOẠCH BÀI DẠY";

        const lessonTitle = formatLessonTitleWithPeriod(rawTitleSource, periodNum);

        if (periodIdx > 0) {
            children.push(
                new Paragraph({
                    children: [new PageBreak()]
                })
            );
        }

        // 1. TIÊU ĐỀ 4 DÒNG VIẾT HOA CĂN GIỮA CHUẨN XÁC
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60, line: 276 },
                children: [
                    new TextRun({
                        text: "KẾ HOẠCH BÀI DẠY",
                        font: "Times New Roman",
                        size: 28, // 14pt
                        bold: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60, line: 276 },
                children: [
                    new TextRun({
                        text: formatGradeHeader(displayGrade),
                        font: "Times New Roman",
                        size: 26, // 13pt
                        bold: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80, line: 276 },
                children: [
                    new TextRun({
                        text: formatSubjectHeader(displaySubject),
                        font: "Times New Roman",
                        size: 26, // 13pt
                        bold: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 180, line: 276 },
                children: [
                    new TextRun({
                        text: "tên bài dạy: ",
                        font: "Times New Roman",
                        size: 26,
                        italics: true,
                        bold: false
                    }),
                    new TextRun({
                        text: lessonTitle.toUpperCase(),
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    })
                ]
            })
        );

        // 2. MỤC I. YÊU CẦU CẦN ĐẠT:
        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 100, after: 50, line: 276 },
                children: [
                    new TextRun({
                        text: "I. YÊU CẦU CẦN ĐẠT:",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    })
                ]
            })
        );

        const formattedObjs = formatObjectives(period.objectives);
        formattedObjs.forEach(obj => {
            children.push(
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { before: 20, after: 40, line: 276 },
                    children: [
                        new TextRun({
                            text: obj.text,
                            font: "Times New Roman",
                            size: 26,
                            italics: obj.isIntegration
                        })
                    ]
                })
            );
        });

        // 3. MỤC II. ĐỒ DÙNG DẠY HỌC:
        const teacherMat = (period.materials?.teacher || '').replace(/\*\*/g, '').replace(/^[-–\*\s]+/, '').trim();
        const studentMat = (period.materials?.student || '').replace(/\*\*/g, '').replace(/^[-–\*\s]+/, '').trim();

        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 120, after: 50, line: 276 },
                children: [
                    new TextRun({
                        text: "II. ĐỒ DÙNG DẠY HỌC:",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 20, after: 40, line: 276 },
                children: [
                    new TextRun({
                        text: "1. GV: ",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    }),
                    new TextRun({
                        text: teacherMat,
                        font: "Times New Roman",
                        size: 26
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 20, after: 100, line: 276 },
                children: [
                    new TextRun({
                        text: "2. HS: ",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    }),
                    new TextRun({
                        text: studentMat,
                        font: "Times New Roman",
                        size: 26
                    })
                ]
            })
        );

        // 4. MỤC III. CÁC HOẠT ĐỘNG DẠY HỌC:
        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 120, after: 60, line: 276 },
                children: [
                    new TextRun({
                        text: "III. CÁC HOẠT ĐỘNG DẠY HỌC:",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    })
                ]
            })
        );

        const headerRow = new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
                new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 80, right: 80 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 8, color: "000000" }
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 20, after: 20, line: 264 },
                            children: [
                                new TextRun({
                                    text: "TG",
                                    font: "Times New Roman",
                                    size: 26,
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                new TableCell({
                    width: { size: 52, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 8, color: "000000" }
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 20, after: 20, line: 264 },
                            children: [
                                new TextRun({
                                    text: "HOẠT ĐỘNG CỦA GIÁO VIÊN",
                                    font: "Times New Roman",
                                    size: 26,
                                    bold: true
                                })
                            ]
                        })
                    ]
                }),
                new TableCell({
                    width: { size: 38, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 12, color: "000000" }
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 20, after: 20, line: 264 },
                            children: [
                                new TextRun({
                                    text: "HOẠT ĐỘNG CỦA HỌC SINH",
                                    font: "Times New Roman",
                                    size: 26,
                                    bold: true
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        // Các dòng nội dung của 4 hoạt động dạy học:
        // Không đặt cantSplit trên bodyRows để Word dàn trang sát xuống đúng lề dưới 2.2cm (22mm) trước khi vẽ đường kẻ ngang đóng khung cuối trang.
        const bodyRows: TableRow[] = [];
        const activities = period.activities || [];

        activities.forEach(act => {
            const formattedActName = formatActivityName(act.name);
            const formattedTopic = act.topic ? formatTopicName(act.topic) : '';
            const actRows = act.rows || [];
            const timeText = (act.time || '').replace(/phút/gi, "'").replace(/\s+/g, '');

            const gvHeaders: string[] = [formattedActName];
            if (formattedTopic) {
                gvHeaders.push(formattedTopic);
            }

            // Dòng tiêu đề của từng Hoạt động tách riêng để gọn nhẹ, giúp các dòng ý lệnh bên dưới tràn sát mốc 2.2cm cuối trang
            bodyRows.push(
                new TableRow({
                    cantSplit: false,
                    children: [
                        new TableCell({
                            width: { size: 10, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.TOP,
                            margins: { top: 35, bottom: 20, left: 60, right: 60 },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 15, after: 20, line: 264 },
                                    children: [
                                        new TextRun({
                                            text: timeText,
                                            font: "Times New Roman",
                                            size: 26,
                                            bold: true
                                        })
                                    ]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 52, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.TOP,
                            margins: { top: 35, bottom: 20, left: 100, right: 100 },
                            children: buildCellParagraphsFromText('', gvHeaders, 0, lessonTitle)
                        }),
                        new TableCell({
                            width: { size: 38, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.TOP,
                            margins: { top: 35, bottom: 20, left: 100, right: 100 },
                            children: [
                                new Paragraph({
                                    spacing: { before: 15, after: 20, line: 264 },
                                    children: [new TextRun({ text: "", font: "Times New Roman", size: 26 })]
                                })
                            ]
                        })
                    ]
                })
            );

            actRows.forEach(row => {
                const alignedSubRows = alignContent(row.teacher, row.student);

                alignedSubRows.forEach(subRow => {
                    bodyRows.push(
                        new TableRow({
                            cantSplit: false,
                            children: [
                                new TableCell({
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.TOP,
                                    margins: { top: 25, bottom: 25, left: 60, right: 60 },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 10, after: 20, line: 264 },
                                            children: [
                                                new TextRun({
                                                    text: "",
                                                    font: "Times New Roman",
                                                    size: 26
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new TableCell({
                                    width: { size: 52, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.TOP,
                                    margins: { top: 25, bottom: 25, left: 100, right: 100 },
                                    children: buildCellParagraphsFromText(subRow.teacher, [], 0, lessonTitle)
                                }),
                                new TableCell({
                                    width: { size: 38, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.TOP,
                                    margins: { top: 25, bottom: 25, left: 100, right: 100 },
                                    children: buildCellParagraphsFromText(subRow.student, [], 0, lessonTitle)
                                })
                            ]
                        })
                    );
                });
            });
        });

        const activitiesTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            columnWidths: [935, 4865, 3555],
            borders: {
                top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }
            },
            rows: [headerRow, ...bodyRows]
        });

        children.push(activitiesTable);

        // 5. ĐIỀU CHỈNH SAU BÀI DẠY:
        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 140, after: 50, line: 276 },
                children: [
                    new TextRun({
                        text: "Điều chỉnh sau bài dạy:",
                        font: "Times New Roman",
                        size: 26,
                        bold: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 20, after: 40, line: 276 },
                children: [
                    new TextRun({
                        text: "................................................................................................................................................................................................................................................",
                        font: "Times New Roman",
                        size: 26,
                        italics: true,
                        color: "555555"
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 20, after: 40, line: 276 },
                children: [
                    new TextRun({
                        text: "................................................................................................................................................................................................................................................",
                        font: "Times New Roman",
                        size: 26,
                        italics: true,
                        color: "555555"
                    })
                ]
            })
        );
    });

    // Bảng Footer ở cuối mỗi trang Word (gọn gàng ở vị trí 1.0cm từ mép dưới, đảm bảo vùng bảng chính kết thúc đúng 2.2cm từ mép dưới trang giấy)
    const footerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
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
                        margins: { top: 30, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                spacing: { before: 0, after: 0, line: 240 },
                                children: [
                                    new TextRun({
                                        text: displaySchool,
                                        font: "Times New Roman",
                                        size: 22, // 11pt
                                        italics: true,
                                        color: "E11D48"
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { top: 30, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                spacing: { before: 0, after: 0, line: 240 },
                                children: [
                                    new TextRun({
                                        text: displayTeacher,
                                        font: "Times New Roman",
                                        size: 22, // 11pt
                                        italics: true,
                                        color: "E11D48"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    const doc = new Document({
        sections: [
            {
                properties: {
                    titlePage: true,
                    page: {
                        size: {
                            width: convertMillimetersToTwip(210),
                            height: convertMillimetersToTwip(297)
                        },
                        margin: {
                            top: convertMillimetersToTwip(20),
                            bottom: convertMillimetersToTwip(22), // Chính xác 2.2cm từ mép dưới đến đường kẻ khung cuối trang của bảng
                            left: convertMillimetersToTwip(30),
                            right: convertMillimetersToTwip(15),
                            header: convertMillimetersToTwip(10),
                            footer: convertMillimetersToTwip(10)
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
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        font: "Times New Roman",
                                        size: 26 // 13pt
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
                children
            }
        ]
    });

    return await Packer.toBlob(doc);
};

export const generateLessonPlanDocHtml = (result: LessonPlanResponse, inputData: any): string => {
    return JSON.stringify({ result, inputData });
};

export const exportToWord = async (result: LessonPlanResponse, _elementId?: string, _hideTableBorders: boolean = true) => {
    await downloadSingleLessonWord(result, {});
};

export const downloadSingleLessonWord = async (
    result: LessonPlanResponse,
    inputData: any,
    customFileName?: string,
    _hideTableBorders: boolean = true
) => {
    try {
        const lessonTitle = customFileName || result.lesson_full_title || `KHBD_Tuan_${inputData?.week || result.week || '1'}`;
        const safeName = lessonTitle.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\.docx?$/i, '').trim();
        const fileName = `${safeName}.docx`;

        const blob = await generateLessonPlanDocxBlob(result, inputData);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Error downloading single lesson word (.docx):', error);
        alert('Có lỗi xảy ra khi tải file Word (.docx): ' + error.message);
    }
};

export const downloadPpctWordTemplate = async () => {
    try {
        const fileName = "Mau_Phan_Phoi_Chuong_Trinh.docx";

        const sampleData = [
            ["Tuần 1", "Bài 1: Phần cứng và phần mềm máy tính", "1", "(Không tích hợp)"],
            ["Tuần 2", "Bài 1: Phần cứng và phần mềm máy tính", "1", "Tích hợp môn Tiếng Việt: Luyện viết đoạn văn; Tích hợp AI tạo sản phẩm số"],
            ["Tuần 3", "Bài 2: Gõ bàn phím đúng cách", "1", "(Không tích hợp)"],
            ["Tuần 4", "Bài 2: Gõ bàn phím đúng cách", "1", "Tích hợp môn Khoa học: Tìm hiểu tự nhiên; Tích hợp Năng lực số tìm kiếm an toàn"],
            ["...", "(Thầy/Cô điền tiếp các bài học theo đúng phân phối chương trình của mình...)", "...", "(Điền nội dung & môn học tích hợp nếu có, để trống nếu không tích hợp)"]
        ];

        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                { text: "TUẦN", width: 14 },
                { text: "TÊN BÀI", width: 44 },
                { text: "SỐ TIẾT", width: 14 },
                { text: "GHI CHÚ (Nội dung & Môn học tích hợp)", width: 28 }
            ].map(col =>
                new TableCell({
                    width: { size: col.width, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: col.text,
                                    font: "Times New Roman",
                                    size: 26,
                                    bold: true
                                })
                            ]
                        })
                    ]
                })
            )
        });

        const dataRows = sampleData.map(row =>
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 14, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 60, bottom: 60, left: 80, right: 80 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: row[0], font: "Times New Roman", size: 26, bold: true })]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 44, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 60, bottom: 60, left: 100, right: 100 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [new TextRun({ text: row[1], font: "Times New Roman", size: 26 })]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 14, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 60, bottom: 60, left: 80, right: 80 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: row[2], font: "Times New Roman", size: 26 })]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 28, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 60, bottom: 60, left: 100, right: 100 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: row[3],
                                        font: "Times New Roman",
                                        size: 24,
                                        italics: row[3].startsWith('('),
                                        bold: !row[3].startsWith('('),
                                        color: row[3].startsWith('(') ? "64748B" : "0F766E"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        );

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                width: convertMillimetersToTwip(210),
                                height: convertMillimetersToTwip(297)
                            },
                            margin: {
                                top: convertMillimetersToTwip(20),
                                bottom: convertMillimetersToTwip(20),
                                left: convertMillimetersToTwip(30),
                                right: convertMillimetersToTwip(15)
                            }
                        }
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 80 },
                            children: [
                                new TextRun({
                                    text: "BẢNG PHÂN PHỐI CHƯƠNG TRÌNH",
                                    font: "Times New Roman",
                                    size: 30,
                                    bold: true
                                })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 160 },
                            children: [
                                new TextRun({
                                    text: "(Mẫu 4 cột chuẩn: Cột 1 Tuần, Cột 2 Tên bài, Cột 3 Số tiết, Cột 4 Ghi chú tích hợp môn học & nội dung)",
                                    font: "Times New Roman",
                                    size: 24,
                                    italics: true
                                })
                            ]
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "000000" }
                            },
                            rows: [headerRow, ...dataRows]
                        })
                    ]
                }
            ]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('Error downloading PPCT Word template:', error);
        alert('Có lỗi xảy ra khi tải file mẫu Word (.docx): ' + error.message);
    }
};

export const normalizeLessonKey = (rawName: string): string => {
    const base = extractBaseLessonName(rawName);
    return base
        .toLowerCase()
        .replace(/[\:\.\-–—,;]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Chuẩn hóa danh sách tuần theo Phân phối chương trình:
 * - Mỗi tuần luôn có đúng 1 tiết học (periods = 1).
 * - Một bài học có thể kéo dài qua nhiều tuần (ví dụ: Tuần 1 Bài 1 -> Tiết 1/2; Tuần 2 Bài 1 -> Tiết 2/2).
 */
export const enrichWeekPlansWithPedagogy = (lessons: any[]): any[] => {
    if (!lessons || lessons.length === 0) return [];

    const enriched = lessons.map((item, idx) => {
        const rawName = item.lessonName || '';
        const baseName = extractBaseLessonName(rawName);
        const explicitPeriod = extractExplicitPeriodNumber(rawName);

        return {
            id: `week-${idx + 1}`,
            week: item.week || `Tuần ${idx + 1}`,
            lessonName: rawName,
            periods: 1, // Mỗi tuần cố định 1 tiết học theo đúng quy chuẩn PPCT
            notes: item.notes || '',
            baseLessonName: baseName,
            periodIndexInLesson: explicitPeriod || 1,
            totalPeriodsInLesson: 1,
            pedagogicalNote: '',
            status: 'idle' as const,
            result: undefined
        };
    });

    // Nhóm các tuần có cùng bài học (normalizeLessonKey) trong phạm vi liền kề hoặc gần nhau (<= 5 tuần)
    const visited = new Set<number>();

    for (let i = 0; i < enriched.length; i++) {
        if (visited.has(i)) continue;
        const currentKey = normalizeLessonKey(enriched[i].baseLessonName);
        const groupIndices: number[] = [i];
        visited.add(i);

        for (let j = i + 1; j < enriched.length; j++) {
            if (visited.has(j)) continue;
            const candidateKey = normalizeLessonKey(enriched[j].baseLessonName);
            const lastMatchedIdx = groupIndices[groupIndices.length - 1];
            if (candidateKey === currentKey && (j - lastMatchedIdx) <= 5) {
                groupIndices.push(j);
                visited.add(j);
            }
        }

        const spanCount = groupIndices.length;
        if (spanCount > 1) {
            groupIndices.forEach((weekIdx, idxInGroup) => {
                const explicitP = extractExplicitPeriodNumber(enriched[weekIdx].lessonName);
                const periodNum = explicitP || (idxInGroup + 1);
                const totalPeriodsAcrossWeeks = Math.max(spanCount, periodNum);

                enriched[weekIdx].periods = 1;
                enriched[weekIdx].periodIndexInLesson = periodNum;
                enriched[weekIdx].totalPeriodsInLesson = totalPeriodsAcrossWeeks;

                if (periodNum === 1) {
                    enriched[weekIdx].pedagogicalNote = `Tiết 1/${totalPeriodsAcrossWeeks}: Nửa đầu SGK (Khởi động chung, Khám phá Mục 1, Luyện tập 1, Vận dụng ngắn)`;
                } else if (periodNum === totalPeriodsAcrossWeeks) {
                    enriched[weekIdx].pedagogicalNote = `Tiết ${periodNum}/${totalPeriodsAcrossWeeks}: Nửa sau SGK (Khởi động kết nối ôn lại tiết trước, Khám phá Mục ${periodNum}, Luyện tập ${periodNum}, Vận dụng toàn bài)`;
                } else {
                    enriched[weekIdx].pedagogicalNote = `Tiết ${periodNum}/${totalPeriodsAcrossWeeks}: Phần tiếp theo của SGK (Khởi động ôn lại tiết trước, Khám phá Mục ${periodNum}, Luyện tập ${periodNum}, Vận dụng)`;
                }
            });
        } else {
            const explicitP = extractExplicitPeriodNumber(enriched[i].lessonName);
            enriched[i].periods = 1;
            if (explicitP && explicitP > 1) {
                enriched[i].periodIndexInLesson = explicitP;
                enriched[i].totalPeriodsInLesson = explicitP;
                enriched[i].pedagogicalNote = `Tiết ${explicitP}/${explicitP}: Phần tiếp theo của bài học trong SGK (Đầy đủ 4 hoạt động dạy học)`;
            } else {
                enriched[i].periodIndexInLesson = 1;
                enriched[i].totalPeriodsInLesson = 1;
                enriched[i].pedagogicalNote = `Bài trọn vẹn 1 tiết trong tuần (35 phút - Đầy đủ 4 hoạt động)`;
            }
        }
    }

    return enriched;
};

