import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var __dbPool: Pool | undefined;
}

export function db() {
    if (!global.__dbPool) {
        const connectionString =
            process.env.DATABASE_URL ??
            process.env["fint.database.url"]?.replace(/^jdbc:/, "");
        const user = process.env["fint.database.username"];
        const password = process.env["fint.database.password"];

        if (!connectionString) {
            throw new Error(
                "DATABASE_URL is not set (and no fint.database.url was provided)"
            );
        }

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