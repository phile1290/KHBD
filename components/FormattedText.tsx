import React from 'react';
import { cleanPrefix } from '../utils';
import {
    isImageHintLine,
    extractCleanImageDescription,
    renderPedagogicalIllustrationDataUrl
} from '../utils/lessonImageGenerator';

interface Props {
    text: string;
    lessonTitle?: string;
}

const FormattedText: React.FC<Props> = ({ text, lessonTitle = '' }) => {
    if (!text) return null;
            
    let processedText = text
        .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:)/gi, '\n$1')
        .replace(/(\[Tích hợp\]:|Tích hợp:)/gi, '\n$1');

    const cleanedText = cleanPrefix(processedText);
    const lines = cleanedText.split('\n');
    
    return (
        <>
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null; 

                const integratedRegex = /^[-–\*\s]*(\[Tích hợp\]|Tích hợp)[:\s]*/i;
                const isImageSuggestion = isImageHintLine(trimmedLine);
                const isIntegrated = integratedRegex.test(trimmedLine);
                
                const baseStyle: React.CSSProperties = { 
                    textAlign: 'justify', 
                    fontFamily: '"Times New Roman", serif', 
                    fontSize: '13pt', 
                    lineHeight: '1.3', 
                    margin: '0 0 3pt 0' 
                };
                
                if (isImageSuggestion) {
                    const imgDataUrl = renderPedagogicalIllustrationDataUrl(trimmedLine, lessonTitle);
                    const cleanDesc = extractCleanImageDescription(trimmedLine);
                    return (
                        <div key={index} style={{ margin: '6pt 0', textAlign: 'center' }}>
                            {imgDataUrl && (
                                <img
                                    src={imgDataUrl}
                                    alt={cleanDesc}
                                    style={{
                                        maxWidth: '100%',
                                        width: '320px',
                                        height: 'auto',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        display: 'inline-block'
                                    }}
                                />
                            )}
                        </div>
                    );
                }

                if (isIntegrated) {
                    let content = trimmedLine.replace(/^[-–\*\s]*(\[Tích hợp\]|Tích hợp)[:\s]*/i, '').trim();
                    if (!content.startsWith('-')) content = `- ${content}`;
                    return (
                        <div key={index} style={{
                            ...baseStyle,
                            color: '#0D9488', 
                            fontStyle: 'italic',
                            fontWeight: 'bold'
                        }}>
                            {content}
                        </div>
                    );
                }

                const cleanText = trimmedLine.replace(/\*\*/g, '');
                return (
                    <div key={index} style={baseStyle}>
                        {cleanText}
                    </div>
                );
            }).filter(Boolean)}
        </>
    );
};

export default FormattedText;