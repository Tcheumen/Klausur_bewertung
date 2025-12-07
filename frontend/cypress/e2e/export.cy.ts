/// <reference types="cypress" />
import 'cypress-wait-until';

describe("Fonction d'exportation complète", () => {
    let savedCallbacks: Record<string, Function>;

    beforeEach(() => {
        cy.visit('/upload');

        cy.window().then((win) => {
            (win as any).savedCallbacks = {};
            (win as any).electronAPI = {
                send: cy.stub().as('ipcSend'),
                receive: (channel: string, cb: Function) => {
                    (win as any).savedCallbacks[channel] = cb;
                }
            };
        });
    });

    function importerEtPréparerDonnées() {
        cy.get('input[type="file"]').selectFile('cypress/fixtures/test.csv', { force: true });
        cy.contains('Hochladen').click();
        cy.get('table.table-bordered tbody').should('contain.text', 'Müller');

        const exercices = [
            { nom: 'Exercice 1', poids: '50' },
            { nom: 'Exercice 2', poids: '25' },
            { nom: 'Exercice 3', poids: '30' },
            { nom: 'Exercice 4', poids: '335' },
        ];

        exercices.forEach(({ nom, poids }) => {
            cy.get('input[placeholder="Aufgabename"]').clear().type(nom);
            cy.get('input[placeholder="Gewichtung"]').clear().type(poids);
            cy.contains('Hinzufügen').click();
        });

        exercices.forEach(({ nom }) => {
            cy.get('table thead').should('contain.text', nom);
        });

        cy.get('table tbody input[type="number"]', { timeout: 10000 }).should('have.length.at.least', 2);

        cy.get('table tbody tr').each(($row) => {
            const $inputs = $row.find('input[type="number"]');
            if ($inputs.length >= exercices.length) {
                cy.wrap($row).within(() => {
                    cy.get('input[type="number"]').each(($input, index) => {
                        const poids = parseInt(exercices[index].poids, 10);
                        const randomNote = Math.floor(Math.random() * (poids + 1)); // 0 à poids inclus
                        cy.wrap($input).clear().type(String(randomNote));
                    });
                });
            }
        });

        cy.contains('Speichern').should('not.be.disabled').click();

        cy.window().then((win) => {
            const cb = (win as any).savedCallbacks?.['evaluation-saved'];
            if (typeof cb === 'function') {
                cy.log('➡️ Déclenchement manuel du callback evaluation-saved');
                cb();
            } else {
                throw new Error('❌ Callback evaluation-saved non trouvé');
            }
        });

        cy.get('p.alert.alert-success', { timeout: 10000 }).should('contain.text', 'Daten erfolgreich gespeichert');
    }

    function stubTéléchargementEtService(methodName: 'exportCsvData' | 'exportExcelData' | 'exportPDF') {
        cy.window().then((win) => {
            const dummyBlob = new Blob(['dummy content'], { type: 'application/octet-stream' });
            cy.stub(win.URL, 'createObjectURL').as('createObjectURL');

            cy.document().then((doc) => {
                cy.waitUntil(() => !!doc.querySelector('app-root'), {
                    timeout: 5000,
                    interval: 500,
                    errorMsg: '❌ app-root introuvable après délai'
                }).then(() => {
                    const appRoot = doc.querySelector('app-root');
                    if (!appRoot) throw new Error('❌ app-root toujours introuvable');

                    const compRef = (win as any).ng?.getComponent?.(appRoot);
                    if (!compRef || !compRef.exportService || typeof compRef.exportService[methodName] !== 'function') {
                        throw new Error(`❌ ${methodName} non disponible sur le service`);
                    }

                    cy.stub(compRef.exportService, methodName).resolves(dummyBlob);
                });
            });
        });

        cy.document().then((doc) => {
            const anchorStub = cy.stub().as('anchorClick');
            const nativeCreateElement = doc.createElement.bind(doc);
            cy.stub(doc, 'createElement').callsFake((tagName) => {
                if (tagName === 'a') {
                    const a = nativeCreateElement('a');
                    a.click = anchorStub;
                    return a;
                }
                return nativeCreateElement(tagName);
            });
        });
    }

    describe('Export', () => {
        it("Déclenche le téléchargement CSV, Excel et PDF après saisie complète", () => {
            importerEtPréparerDonnées();

            const formats: Array<{ label: string; method: 'exportCsvData' | 'exportExcelData' | 'exportPDF' }> = [
                { label: 'CSV herunterladen', method: 'exportCsvData' },
                { label: 'Excel herunterladen', method: 'exportExcelData' },
                { label: 'PDF herunterladen', method: 'exportPDF' }
            ];

            formats.forEach(({ label, method }, index) => {
                if (index > 0) {
                    // Restaurer les stubs précédents avant de les re-définir
                    cy.window().then((win) => {
                        (win.URL.createObjectURL as any)?.restore?.();
                    });
                    cy.document().then((doc) => {
                        (doc.createElement as any)?.restore?.();
                    });
                }

                stubTéléchargementEtService(method);

                cy.contains(label).should('not.be.disabled').click();
                cy.get('@createObjectURL').should('have.been.called');
                cy.get('@anchorClick').should('have.been.called');
            });
            
        });

        it("Empêche l'export sans données enregistrées", () => {
            cy.contains('CSV herunterladen').should('be.disabled');
            cy.contains('Excel herunterladen').should('be.disabled');
            cy.contains('PDF herunterladen').should('be.disabled');
        });
    });
});
