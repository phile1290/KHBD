const fs = require('fs');
let code = fs.readFileSync('components/LessonPreview.tsx', 'utf8');

if (code.includes('const isLastRowOfTableBody =')) {
    console.log("Already has isLastRowOfTableBody logic");
} else {
    const target1 = "const topBorderStyle = isFirstRowOfTableBody ? '1px solid black' : 'none';";
    const replacement1 = `const isLastRowOfTableBody = actIndex === period.activities.length - 1 && rowIndex === act.rows.length - 1 && subRowIndex === alignedSubRows.length - 1;
                                                const topBorderStyle = isFirstRowOfTableBody ? '1px solid black' : 'none';
                                                const bottomBorderStyle = isLastRowOfTableBody ? '2px solid black' : 'none';`;
                                                
    const target2 = `                                                    <tr key={\`\${actIndex}-\${rowIndex}-\${subRowIndex}\`}>
                                                        <td className={className} style={{ ...styles.bodyCellCenterBase, borderTop: topBorderStyle }}>`;
    const replacement2 = `                                                    <tr key={\`\${actIndex}-\${rowIndex}-\${subRowIndex}\`}>
                                                        <td className={className} style={{ ...styles.bodyCellCenterBase, borderTop: topBorderStyle, borderBottom: bottomBorderStyle }}>`;

    const target3 = `                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle }}>
                                                            {isFirstRowOfActivity && (`;
    const replacement3 = `                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle, borderBottom: bottomBorderStyle }}>
                                                            {isFirstRowOfActivity && (`;
                                                            
    const target4 = `                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle }}>
                                                            {isFirstRowOfActivity && act.topic && <div style={{fontWeight: 'bold', marginBottom: '3pt', visibility: 'hidden'}}>{formatTopicName(act.topic)}</div>}`;
    const replacement4 = `                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle, borderBottom: bottomBorderStyle }}>
                                                            {isFirstRowOfActivity && act.topic && <div style={{fontWeight: 'bold', marginBottom: '3pt', visibility: 'hidden'}}>{formatTopicName(act.topic)}</div>}`;

    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    code = code.replace(target3, replacement3);
    code = code.replace(target4, replacement4);

    fs.writeFileSync('components/LessonPreview.tsx', code);
    console.log("Patched LessonPreview.tsx successfully");
}
