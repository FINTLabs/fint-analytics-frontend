import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var __dbPool: Pool | undefined;
}

function normalizeConnectionString(value: string): string {
    const withoutJdbcPrefix = value.replace(/^jdbc:/, "");

    // Managed PostgreSQL providers often expose `sslmode=require`.
    // pg currently interprets that more strictly than libpq unless `uselibpqcompat=true`.
    if (
        withoutJdbcPrefix.includes("sslmode=require") &&
        !withoutJdbcPrefix.includes("uselibpqcompat=")
    ) {
        const separator = withoutJdbcPrefix.includes("?") ? "&" : "?";
        return `${withoutJdbcPrefix}${separator}uselibpqcompat=true`;
    }

    return withoutJdbcPrefix;
}

export function db() {
    if (!global.__dbPool) {
        const rawConnectionString =
            process.env.DATABASE_URL ?? process.env["fint.database.url"];
        const user = process.env["fint.database.username"];
        const password = process.env["fint.database.password"];

        if (!rawConnectionString) {
            throw new Error(
                "DATABASE_URL is not set (and no fint.database.url was provided)"
            );
        }
        const connectionString = normalizeConnectionString(rawConnectionString);

        global.__dbPool = new Pool({
            connectionString,
            user,
            password,
        });
    }
    return global.__dbPool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
    const result = await db().query(text, params);
    return result.rows as T[];
}