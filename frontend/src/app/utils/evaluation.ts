import { Threshold } from "../models/threshold";



export const getBewertung = (total: number, thresholds: Threshold[]): number => {
    if (!thresholds || thresholds.length === 0) return 0;

    const validThresholds = thresholds.filter(threshold => threshold.points > 0 && threshold.percentage > 0);
    if (validThresholds.length === 0) return 0;

    const closestThreshold = validThresholds.reduce((prev, curr) => {
        return Math.abs(curr.points - total) < Math.abs(prev.points - total) ? curr : prev;
    });

    return closestThreshold.points && closestThreshold.percentage
        ? Math.round((total * closestThreshold.percentage) / closestThreshold.points)
        : 0;
};

export const getNote = (bewertung: number): string => {
    if (bewertung >= 0 && bewertung <= 29.5) return "g.n.b";
    if (bewertung >= 30 && bewertung <= 49.5) return "n.b";
    if (bewertung >= 50 && bewertung <= 54.5) return "4,0";
    if (bewertung >= 55 && bewertung <= 59.5) return "3,7";
    if (bewertung >= 60 && bewertung <= 64.5) return "3,3";
    if (bewertung >= 65 && bewertung <= 69.5) return "3,0";
    if (bewertung >= 70 && bewertung <= 74.5) return "2,7";
    if (bewertung >= 75 && bewertung <= 79.5) return "2,3";
    if (bewertung >= 80 && bewertung <= 84.5) return "2,0";
    if (bewertung >= 85 && bewertung <= 89.5) return "1,7";
    if (bewertung >= 90 && bewertung <= 94.5) return "1,3";
    if (bewertung >= 95 && bewertung <= 100) return "1,0";

    return "Note non définie";
};
