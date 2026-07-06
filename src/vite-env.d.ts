/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_PASSKEY?: string;
  readonly VITE_PAGES_ACCESS_CODE?: string;
  readonly VITE_DISCORD_FEEDBACK_WEBHOOK_URL?: string;
}
