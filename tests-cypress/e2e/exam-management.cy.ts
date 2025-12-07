describe('Exam Management (/upload)', () => {

    it('sollte Aufgaben anzeigen und hinzufügen und sie dann in einer JSON-Datei speichern', () => {
        const tasks = [
            { name: 'Aufgabe 1', weight: 10 },
            { name: 'Aufgabe 2', weight: 15 },
            { name: 'Aufgabe 3', weight: 20 }
        ];

        cy.visit('/upload');

        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').should('not.be.disabled').click();

        cy.contains('Übungen verwalten').should('be.visible');
        cy.contains('button', 'Hinzufügen').should('not.be.disabled');

        tasks.forEach(({ name, weight }) => {
            cy.get('input[placeholder="Aufgabename"]').clear().type(name);
            cy.get('input[placeholder="Gewichtung"]').clear().type(weight.toString());
            cy.contains('button', 'Hinzufügen').click();
        });

        cy.get('table.table tbody tr').should('have.length.at.least', tasks.length);

        cy.writeFile('cypress/fixtures/aufgaben.json', tasks);

        cy.readFile('cypress/fixtures/aufgaben.json').then((data) => {
            expect(data).to.deep.equal(tasks);
        });
    });

    // ⚠️ Stelle sicher, dass die Route dieser Komponente tatsächlich /upload ist
    beforeEach(() => {
        cy.visit('/upload');
    });

    it('zeigt die Basisoberfläche an und die Buttons sind anfangs deaktiviert', () => {
        cy.contains('CSV-Datei importieren').should('be.visible');
        cy.get('#csvFile').should('exist');
        cy.contains('button', 'Hochladen').should('be.disabled');
        cy.contains('Übungen verwalten').should('be.visible');
        cy.get('input[placeholder="Aufgabename"]').should('exist');
        cy.get('input[placeholder="Gewichtung"]').should('exist');
        cy.contains('button', 'Hinzufügen').should('be.disabled');
        cy.contains('Studierendenliste').should('be.visible');
        cy.contains('Aktionen').should('be.visible');
        cy.contains('button', 'Zurück').should('be.visible');
        cy.contains('button', 'Speichern').should('be.disabled');
        cy.contains('button', 'Beenden').should('be.disabled');
    });

    it('importiert eine CSV-Datei und aktiviert das Hinzufügen von Aufgaben', () => {
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').should('not.be.disabled').click();
        cy.contains('Datei erfolgreich geladen!').should('be.visible');
        cy.contains('button', 'Hinzufügen').should('not.be.disabled');
        cy.contains('button', 'Speichern').should('not.be.disabled');
        cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('zeigt einen Fehler an, wenn versucht wird, eine leere oder falsch definierte Aufgabe hinzuzufügen', () => {
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').click();

        cy.get('input[placeholder="Aufgabename"]').clear();
        cy.get('input[placeholder="Gewichtung"]').clear().type('0');
        cy.contains('button', 'Hinzufügen').click();

        cy.contains('Bitte geben Sie den Namen der Aufgabe und ihre Gewichtung an.')
            .should('be.visible');
    });

    it('zeigt einen Fehler an, wenn eine Aufgabe mit bereits vorhandenem Namen hinzugefügt wird', () => {
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').click();

        cy.get('input[placeholder="Aufgabename"]').clear().type('Aufgabe 1');
        cy.get('input[placeholder="Gewichtung"]').clear().type('10');
        cy.contains('button', 'Hinzufügen').click();

        cy.get('input[placeholder="Aufgabename"]').clear().type('Aufgabe 1');
        cy.get('input[placeholder="Gewichtung"]').clear().type('5');
        cy.contains('button', 'Hinzufügen').click();

        cy.contains('"Aufgabe 1" existiert bereits').should('be.visible');
    });

    it('zeigt einen Fehler an, wenn eine Note den Maximalwert einer Aufgabe überschreitet', () => {
        // CSV hochladen
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').click();

        // Aufgabe mit Gewicht 10 hinzufügen
        cy.get('input[placeholder="Aufgabename"]').clear().type('Aufgabe 1');
        cy.get('input[placeholder="Gewichtung"]').clear().type('10');
        cy.contains('button', 'Hinzufügen').click();

        // 🔎 Karte "Studierendenliste" anvisieren und dann deren Tabelle
        cy.contains('h5', 'Studierendenliste')
            .parents('.card')
            .find('tbody tr')
            .first()
            .find('input[type="number"]')
            .first()
            .as('scoreInput');

        // Wert > 10 eingeben (Grenze von Aufgabe 1)
        cy.get('@scoreInput').clear().type('15').blur();

        // Erwartete Fehlermeldung
        cy.contains('Die Note darf 10 für Aufgabe 1 nicht überschreiten')
            .should('be.visible');
    });

    it('importiert die CSV, verwaltet die Aufgaben, erfasst die Noten, speichert, exportiert JSON und löst die Downloads aus', () => {
        // 1) Konfiguration der Aufgaben und Studierenden mit Noten
        const taskOrder = ['Aufgabe 1', 'Aufgabe 2', 'Aufgabe 3', 'Aufgabe 4'];

        const taskWeights: Record<string, number> = {
            'Aufgabe 1': 25,
            'Aufgabe 2': 20,
            'Aufgabe 3': 30,
            'Aufgabe 4': 14,
        };

        const thresholds = [
            { points: 34, percentage: 50, note: 4 },
            { points: 68, percentage: 95, note: 1.3 },
            { points: 77, percentage: 100, note: 1 },
        ];

        // 2) Zu /upload wechseln
        cy.visit('/upload');

        // Am Anfang müssen die Export-Buttons deaktiviert sein
        cy.contains('button', 'CSV herunterladen').should('be.disabled');
        cy.contains('button', 'Excel herunterladen').should('be.disabled');
        cy.contains('button', 'PDF herunterladen').should('be.disabled');

        // 3) CSV hochladen
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').should('not.be.disabled').click();

        // 4) Die 4 Aufgaben mit den richtigen Gewichten hinzufügen
        const tasksWithWeights = [
            { name: 'Aufgabe 1', weight: 25 },
            { name: 'Aufgabe 2', weight: 20 },
            { name: 'Aufgabe 3', weight: 30 },
            { name: 'Aufgabe 4', weight: 14 },
        ];

        tasksWithWeights.forEach(({ name, weight }) => {
            cy.get('input[placeholder="Aufgabename"]').clear().type(name);
            cy.get('input[placeholder="Gewichtung"]').clear().type(weight.toString());
            cy.contains('button', 'Hinzufügen').click();
        });

        // Es muss mindestens eine Studierendenzeile in der Studierendenliste geben
        cy.contains('h5', 'Studierendenliste')
            .parents('.card')
            .find('tbody tr')
            .should('have.length.at.least', 1);

        // 5) Noten zufällig ausfüllen, ohne das Gewicht jeder Aufgabe zu überschreiten
        cy.contains('h5', 'Studierendenliste')
            .parents('.card')
            .find('tbody tr')
            .each(($row) => {
                cy.wrap($row)
                    .find('input[type="number"]')
                    .each(($input, index) => {
                        const taskName = taskOrder[index];
                        if (!taskName) return; // falls es mehr Inputs als Aufgaben gibt

                        const max = taskWeights[taskName];
                        const randomScore = Cypress._.random(0, max); // 0 <= score <= max

                        cy.wrap($input).clear().type(String(randomScore)).blur(); // blur, um das change-Event auszulösen
                    });
            });

        // 6) Daten über den Button "Speichern" sichern
        cy.contains('button', 'Speichern').should('not.be.disabled').click();

        // Beenden muss nach dem Speichern aktiv werden
        cy.contains('button', 'Beenden', { timeout: 15000 }).should('not.be.disabled');

        // Die Export-Buttons müssen jetzt aktiviert sein
        cy.contains('button', 'CSV herunterladen').should('not.be.disabled');
        cy.contains('button', 'Excel herunterladen').should('not.be.disabled');
        cy.contains('button', 'PDF herunterladen').should('not.be.disabled');

        // 7) Das finale JSON-Objekt aufbauen (nach Eingabe + Save)
        const result: {
            students: any[];
            tasks: string[];
            taskWeights: Record<string, number>;
            thresholds: { points: number; percentage: number; note: number }[];
        } = {
            students: [],
            tasks: taskOrder,
            taskWeights,
            thresholds,
        };

        cy.contains('h5', 'Studierendenliste')
            .parents('.card')
            .find('tbody tr')
            .each(($row) => {
                const $cells = $row.find('td');

                const mtknr = $cells.eq(0).text().trim();
                const nachname = $cells.eq(1).text().trim();
                const vorname = $cells.eq(2).text().trim();
                const pversuch = $cells.eq(3).text().trim();
                const pvermerk = $cells.eq(4).text().trim();
                const sitzplatz = $cells.eq(5).text().trim();

                const scores: Record<string, number> = {};
                const $inputs = $row.find('input[type="number"]');

                taskOrder.forEach((taskName, index) => {
                    const val = Number($inputs.eq(index).val() || 0);
                    scores[taskName] = val;
                });

                result.students.push({
                    mtknr,
                    nachname,
                    vorname,
                    pversuch,
                    pvermerk,
                    sitzplatz,
                    scores,
                    // du kannst hier auch total/bewertung/note wieder auslesen, falls sie als Spalten angezeigt werden
                });
            })
            .then(() => {
                // 8) JSON nach dem Speichern in eine Datei schreiben
                cy.writeFile('tests-cypress/fixtures/notes_result.json', result);

                // Minimale Prüfung
                cy.readFile('tests-cypress/fixtures/notes_result.json').then((data) => {
                    expect(data).to.have.property('students');
                    expect(data).to.have.property('tasks');
                    expect(data).to.have.property('taskWeights');
                    expect(data).to.have.property('thresholds');
                    expect(data.tasks).to.deep.equal(taskOrder);
                });
            });

        // 9) CSV-/Excel-/PDF-Downloads auslösen
        cy.contains('button', 'CSV herunterladen').click();
        cy.contains('button', 'Excel herunterladen').click();
        cy.contains('button', 'PDF herunterladen').click();

        // 10) Navigation: Zurück und dann Beenden
        cy.contains('button', 'Zurück').click();
        cy.url().should('include', '/threshold');

        cy.visit('/upload');

        // Schneller Zyklus upload + save, um Beenden → /module zu testen
        cy.get('#csvFile').selectFile('tests-cypress/fixtures/ecampus_export.csv', { force: true });
        cy.contains('button', 'Hochladen').click();
        cy.get('input[placeholder="Aufgabename"]').clear().type('Aufgabe 1');
        cy.get('input[placeholder="Gewichtung"]').clear().type('10');
        cy.contains('button', 'Hinzufügen').click();
        cy.contains('button', 'Speichern').click();

        cy.contains('button', 'Beenden', { timeout: 15000 }).should('not.be.disabled');
        cy.contains('button', 'Beenden').click();
        cy.url().should('include', '/module');
    });

});
