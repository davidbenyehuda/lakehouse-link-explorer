/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_USE_MOCK_SERVICES: string; // Or boolean, if you parse it
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
