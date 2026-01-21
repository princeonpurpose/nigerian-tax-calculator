/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 * 
 * These define the environment variables available in the app.
 * For Netlify deployment, set these in your site's environment variables.
 */
interface ImportMetaEnv {
  /** Supabase project URL */
  readonly VITE_SUPABASE_URL: string;
  /** Supabase anonymous/public key (safe for client-side) */
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Current mode (development/production) */
  readonly MODE: string;
  /** Base URL */
  readonly BASE_URL: string;
  /** Is production build */
  readonly PROD: boolean;
  /** Is development mode */
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
