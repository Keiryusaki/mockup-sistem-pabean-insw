/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_PASSKEY?: string;
  readonly VITE_PAGES_ACCESS_CODE?: string;
  readonly VITE_DISCORD_FEEDBACK_SUBMIT_URL?: string;
  readonly VITE_FEEDBACK_FEED_URL?: string;
}
