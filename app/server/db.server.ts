import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var __dbPool: Pool | undefined;
}

function getEnv(...keys: string[]): string | undefined {
    for (const key of keys) {
        const value = process.env[key];
        if (value && value.trim().length > 0) return value;
    }
    return undefined;
}

function normalizeConnectionString(value: string): string {
    const withoutJdbcPrefix = value.replace(/^jdbc:/, "");
    const url = new URL(withoutJdbcPrefix);

    const username =
        getEnv("DATABASE_USERNAME", "DB_USER", "PGUSER", "fint.database.username", "FINT_DATABASE_USERNAME") ??
        url.searchParams.get("ApplicationName") ??
        undefined;
    const password = getEnv(
        "DATABASE_PASSWORD",
        "DB_PASSWORD",
        "PGPASSWORD",
        "fint.database.password",
        "FINT_DATABASE_PASSWORD"
    );

    if (!url.username && username) {
        url.username = username;
    }
    if (!url.password && password) {
        url.password = password;
    }

    // Managed PostgreSQL providers often expose `sslmode=require`.
    // pg currently interprets that more strictly than libpq unless `uselibpqcompat=true`.
    if (
        url.searchParams.get("sslmode") === "require" &&
        !url.searchParams.has("uselibpqcompat")
    ) {
        url.searchParams.set("uselibpqcompat", "true");
    }

    return url.toString();
}

export function db() {
    if (!global.__dbPool) {
        const rawConnectionString = getEnv(
            "DATABASE_URL",
            "fint.database.url",
            "FINT_DATABASE_URL"
        );

        if (!rawConnectionString) {
            throw new Error(
                "DATABASE_URL is not set (and no fint.database.url was provided)"
            );
        }
        const connectionString = normalizeConnectionString(rawConnectionString);

        global.__dbPool = new Pool({
            connectionString,
        });
    }
    return global.__dbPool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
    const result = await db().query(text, params);
    return result.rows as T[];
}