import PDFParser from 'pdf2json';
import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

export interface PdfValidationResult {
    numPages: number;
    text: string;
    metadata: any;
    isValid: boolean;
    fileSize: number;
}

export interface ExamConfig {
    modultitel: string;
    modulnummer: string;
    prufungsdatum: string;
    prufer: string;
}

export interface Student {
    mtknr: string;
    nachname: string;
    vorname: string;
    gesamtpunkte: number;
    bewertung: string | number;
}

/**
 * Extrahiert den Text eines PDFs mit pdf2json
 */
async function extractTextWithPdf2Json(pdfPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(`Fehler beim Parsen des PDF: ${errData.parserError}`));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            // Text aus allen Seiten extrahieren
            const text = pdfParser.getRawTextContent();
            resolve(text);
        });

        pdfParser.loadPDF(pdfPath);
    });
}

/**
 * Extrahiert die Metadaten mit pdf-lib
 */
async function extractMetadata(pdfPath: string): Promise<any> {
    const pdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
    });

    return {
        Title: pdfDoc.getTitle() || '',
        Author: pdfDoc.getAuthor() || '',
        Subject: pdfDoc.getSubject() || '',
        Creator: pdfDoc.getCreator() || '',
        Producer: pdfDoc.getProducer() || '',
        CreationDate: pdfDoc.getCreationDate(),
        ModificationDate: pdfDoc.getModificationDate(),
    };
}

/**
 * Extrahiert Struktur und Inhalt eines PDFs
 */
export async function validatePdfStructure(
    pdfPath: string
): Promise<PdfValidationResult> {
    try {
        // pdf-lib für Metadaten und Seitenanzahl verwenden
        const pdfBytes = readFileSync(pdfPath);
        const fileSize = pdfBytes.length;

        const pdfDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: false,
        });

        const numPages = pdfDoc.getPageCount();
        const metadata = await extractMetadata(pdfPath);

        // pdf2json für Textextraktion verwenden
        const text = await extractTextWithPdf2Json(pdfPath);

        return {
            numPages,
            text,
            metadata,
            isValid: true,
            fileSize,
        };
    } catch (error) {
        throw new Error(`Ungültiges oder beschädigtes PDF: ${error}`);
    }
}

/**
 * Extrahiert nur den Text eines PDFs
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
    try {
        return await extractTextWithPdf2Json(pdfPath);
    } catch (error) {
        // Fallback: Versuch mit dem Rohinhalt
        console.warn('Text kann mit pdf2json nicht extrahiert werden, Fallback wird verwendet');
        const pdfBytes = readFileSync(pdfPath);
        return pdfBytes.toString('utf8');
    }
}

/**
 * Validiert den PDF-Kopf anhand der Konfigurationsinformationen
 */
export async function validatePdfHeader(
    pdfText: string,
    expectedConfig: ExamConfig
): Promise<boolean> {
    const assertions = {
        hasModulTitle: pdfText.includes(expectedConfig.modultitel),
        hasModulNumber: pdfText.includes(expectedConfig.modulnummer),
        hasExamDate: pdfText.includes(expectedConfig.prufungsdatum),
        hasExaminer: pdfText.includes(expectedConfig.prufer),
    };

    return Object.values(assertions).every(v => v === true);
}

/**
 * Validiert die Studierendendaten im PDF
 */
export async function validateStudentDataInPdf(
    pdfText: string,
    expectedStudents: Student[]
): Promise<{ student: string; valid: boolean }[]> {
    const results = [];

    for (const student of expectedStudents) {
        const hasMatrikel = pdfText.includes(student.mtknr);
        const hasName = pdfText.includes(`${student.nachname}, ${student.vorname}`);

        // Prüfen, ob die Punkte vorhanden sind (außer bei "ne" - nicht erschienen)
        if (student.bewertung !== 'ne') {
            const hasScore = pdfText.includes(student.gesamtpunkte.toString());
            results.push({
                student: student.mtknr,
                valid: hasMatrikel && hasName && hasScore,
            });
        } else {
            results.push({
                student: student.mtknr,
                valid: hasMatrikel && hasName,
            });
        }
    }

    return results;
}

/**
 * Prüft, dass alle Validierungen der Studierenden korrekt sind
 */
export function areAllStudentsValid(
    validationResults: { student: string; valid: boolean }[]
): boolean {
    return validationResults.every(r => r.valid);
}

/**
 * Validiert die Vollständigkeit des PDFs (Pflichtfelder)
 */
export async function validateCompleteness(
    pdfText: string
): Promise<{ isComplete: boolean; missingFields: string[] }> {
    const requiredFields = [
        { field: 'Prüfungsbewertungsbericht', label: 'Berichtstitel' },
        { field: 'Modultitel', label: 'Modultitel' },
        { field: 'Modulnummer', label: 'Modulnummer' },
        { field: 'Prüfungsdatum', label: 'Prüfungsdatum' },
        { field: 'Prüfer', label: 'Prüfer' },
        { field: 'Notenverteilung', label: 'Notenverteilung' },
        { field: 'Teilnehmerdaten', label: 'Teilnehmerdaten' },
    ];

    const missingFields: string[] = [];

    for (const { field, label } of requiredFields) {
        if (!pdfText.includes(field)) {
            missingFields.push(label);
        }
    }

    return {
        isComplete: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validiert die statistischen Abschnitte des PDFs
 */
export function validateStatisticalSections(pdfText: string): {
    hasNotenverteilung: boolean;
    hasErfolgsrate: boolean;
    hasDurchschnittswerte: boolean;
} {
    return {
        hasNotenverteilung: pdfText.includes('Notenverteilung'),
        hasErfolgsrate: pdfText.includes('Erfolgsrate'),
        hasDurchschnittswerte: pdfText.includes('Durchschnittswerte pro Übung'),
    };
}
