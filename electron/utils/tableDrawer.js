const PAGE_WIDTH = 595.28; 
const PAGE_HEIGHT = 750;
const MARGIN_TOP = 50;
const ROW_PADDING = 5;
const COLUMN_WIDTH = 100; 

const drawTable = (doc, headers, rows, startY) => {
    const columnCount = headers.length;
    const tableWidth = COLUMN_WIDTH * columnCount;
    const startX = (PAGE_WIDTH - tableWidth) / 2; 
    let y = startY;

    const addNewPageIfNeeded = (rowHeight) => {
        if (y + rowHeight > PAGE_HEIGHT) {
            doc.addPage();
            y = MARGIN_TOP;
        }
    };

    const calculateRowHeight = (row) => {
        let maxHeight = 0;
        row.forEach(cell => {
            const textHeight = doc.font('Helvetica').fontSize(9).heightOfString(String(cell), { width: COLUMN_WIDTH - 10 });
            maxHeight = Math.max(maxHeight, textHeight + 2 * ROW_PADDING);
        });
        return maxHeight;
    };

    doc.font('Helvetica-Bold').fontSize(9);
    const headerHeight = calculateRowHeight(headers);
    addNewPageIfNeeded(headerHeight);
    
    headers.forEach((header, i) => {
        doc.rect(startX + (i * COLUMN_WIDTH), y, COLUMN_WIDTH, headerHeight).stroke();
        doc.text(header, startX + (i * COLUMN_WIDTH) + 5, y + ROW_PADDING, { width: COLUMN_WIDTH - 10, align: 'center' });
    });

    y += headerHeight;

    doc.font('Helvetica').fontSize(9);
    rows.forEach(row => {
        const rowHeight = calculateRowHeight(row);
        addNewPageIfNeeded(rowHeight);

        row.forEach((cell, i) => {
            doc.rect(startX + (i * COLUMN_WIDTH), y, COLUMN_WIDTH, rowHeight).stroke();
            doc.text(String(cell), startX + (i * COLUMN_WIDTH) + 5, y + ROW_PADDING, { width: COLUMN_WIDTH - 10, align: 'center' });
        });

        y += rowHeight;
    });

    doc.moveDown(1);
};

module.exports = { drawTable };
