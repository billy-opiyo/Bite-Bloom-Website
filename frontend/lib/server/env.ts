import "server-only";

type ServerEnvironment = {
  databaseUrl?: string;
  nodeEnv: "development" | "test" | "production";
};

function readNodeEnv(value: string | undefined): ServerEnvironment["nodeEnv"] {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

export function getServerEnvironment(): ServerEnvironment {
  return {
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: readNodeEnv(process.env.NODE_ENV),
  };
}

export function hasDatabaseConfiguration(): boolean {
  return Boolean(getServerEnvironment().databaseUrl);
}

export function requireDatabaseUrl(): string {
  const databaseUrl = getServerEnvironment().databaseUrl;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}
