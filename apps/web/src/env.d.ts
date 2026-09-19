/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WS_HOST: string;
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
