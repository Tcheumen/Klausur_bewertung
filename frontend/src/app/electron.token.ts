// electron.token.ts
export type ElectronAPI = {
    test: {
        loadFixtures(payload?: any): void;
        resetState(payload?: any): void;
        setThresholds(payload?: any): void;
        seedModules(payload?: any): void;
        seedStudents(payload?: any): void;
        resetStateSync(payload?: any): Promise<any>;
    };
    export: {
        run(options?: any): Promise<{ ok: boolean; filename?: string; error?: string }>;
        onStatus(listener: (msg: any) => void): () => void;
        onceStatus(listener: (msg: any) => void): void;
    };
};

declare global {
    interface Window {
        electronAPI?: ElectronAPI; // note: optionnel en mode web
    }
}

export const getElectronAPI = (): ElectronAPI | undefined => window.electronAPI;
