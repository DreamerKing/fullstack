declare namespace NodeJS {
  interface ProcessEnv {
    DATABAS_URL: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
    CORS_ORIGIN: string;
  }
}