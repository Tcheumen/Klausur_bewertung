export interface Student {
    mtknr: string;
    nachname: string;
    vorname: string;
    pversuch: string;
    pvermerk: string;
    sitzplatz: string;
    scores: { [taskName: string]: number };
    total?: number;
    bewertung?: number | null;
    note?: string;
}
