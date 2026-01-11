/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  // add more env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
