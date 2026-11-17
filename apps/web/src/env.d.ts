/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WS_HOST: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
  readonly PUBLIC_PRIVACY_URL?: string;
  readonly PUBLIC_TERMS_URL?: string;
  readonly PUBLIC_AUTHOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
