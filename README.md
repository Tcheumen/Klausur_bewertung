# 🎓 Klausurbewertung

## Einführung
Die Anwendung **Klausurbewertung** ist eine Desktop-App, die mit **Angular, Electron und Node.js** entwickelt wurde.  
Sie automatisiert die Bewertung von Prüfungsergebnissen, indem sie CSV-Dateien importiert und CSV, Excel- sowie PDF-Berichte generiert.


## 🔧 Technologien

- **Frontend**: [Angular CLI](https://angular.dev/) (v19)
- **Desktop-Umgebung:** [Electron](https://www.electronjs.org/)
- **Programmiersprachen:** TypeScript, JavaScript
- **Styling & UI:** [Bootstrap](https://getbootstrap.com/), [FontAwesome](https://fontawesome.com/)
- **Backend & Systemzugriff:** [Node.js](https://nodejs.org/)(v20), fs-Modul, IPC-Kommunikation

---

## 🔍 Projektstruktur

```bash
/data/                           # Lokale JSON-Daten
├── evaluation-data.json
├── module-info.json
└── thresholds.json

/electron/
├── handlers/                    # Event-Handler
│   ├── evaluation-handler.js
│   ├── export-handler.js
│   ├── module-handler.js
│   └── threshold-handler.js
├── services/                    # Export-/Verarbeitungsdienste
│   ├── csvService.js
│   ├── excelService.js
│   └── pdfService.js
├── utils/                       # Dienstprogramme
│   ├── chartGenerator.js
│   ├── normalize.js
│   ├── studentsStatistics.js
│   └── tableDrawer.js
├── main.js                      # Hauptprozess (Electron)
└── preload.js                   # contextBridge-API

/frontend/
│├── src/
    ├── app/
       ├── components/          # Angular-Komponenten
          ├── csv-export/
          ├── exam-management/
          ├── export-execel/
          ├── home/
          ├── module-info/
          ├── navbar/
          ├── pdf-export/
          └── thresholds/
    │   ├── models/              # TypeScript-Modelle
          ├── moduleInfo.ts
          ├── student.ts
          ├── task.ts
          └── threshold.ts 
    │   ├── services/            # Angular-Services
          ├── export_file/
          ├── file-import/
          ├── student/
          ├── task/
          └── thresholds/
    │   └── utils/               # Hilfsfunktionen
          └── evaluation.ts
    
```

 ## Hauptfunktionen

### 1. **Import der Ergebnisse**
- Laden von **CSV-Dateien** mit Teilnehmern und deren Ergebnissen.  
- Zuordnung der Ergebnisse zu den definierten Übungen und Gewichtungen.  

### 2. **Verwaltung der Übungen**
- Definition der Übungen und deren **Gewichtung**.  
- Manuelle Eingabe der **Punkte pro Student**.  

### 3. **Berechnung und Bewertung**
- Automatische Berechnung der **Endnoten**.  
- Anwendung der **Notenschwellen** für die Bewertung.  
- Berechnung von **Statistiken** (Durchschnitt, Median, Standardabweichung).  

### 4. **Visualisierung und Berichte**  
- Generierung und **Export von Berichten** als **CSV, Excel und PDF**.  
- Anzeige der **Ergebnisse** in Tabellen und **Diagrammen**.


## Installation und Ausführung

### 1. **Installation der Abhängigkeiten**
```sh

cd klausur_bewertung
npm install

# Installation des Frontends
cd frontend
npm install

```

### 2. **Starten der Anwendung**
```sh
# Im Projektstammverzeichnis
cd klausur_bewertung
npm run start:electron

```

## Fazit
Dieses Projekt zielt darauf ab, die Prüfungsbewertung zu vereinfachen und zu automatisieren, indem es die mühsame Arbeit mit Excel-Dateien ersetzt. Durch die Integration von Angular, Node.js und Electron bietet es eine benutzerfreundliche Oberfläche und eine effiziente Datenverwaltung mit erweiterten Funktionen für den Import, die Berechnung und den Export von Ergebnissen.