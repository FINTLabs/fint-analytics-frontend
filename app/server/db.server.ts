import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var __dbPool: Pool | undefined;
    // eslint-disable-next-line no-var
    var __dbInitPromise: Promise<void> | undefined;
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

async function ensureDbInitialized() {
    if (!global.__dbInitPromise) {
        global.__dbInitPromise = (async () => {
            const pool = db();
            await pool.query(`
                create table if not exists analytics_event (
                    id bigserial primary key,
                    ts timestamptz not null default now(),
                    app text not null,
                    type text not null,
                    path text null,
                    element text null,
                    tenant text null,
                    meta jsonb null
                );
            `);
            await pool.query(
                "create index if not exists analytics_event_ts_idx on analytics_event (ts)"
            );
            await pool.query(
                "create index if not exists analytics_event_app_ts_idx on analytics_event (app, ts)"
            );
            await pool.query(
                "create index if not exists analytics_event_type_ts_idx on analytics_event (type, ts)"
            );
            await pool.query(
                "create index if not exists analytics_event_path_idx on analytics_event (path)"
            );
        })();
    }

    await global.__dbInitPromise;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
    await ensureDbInitialized();
    const result = await db().query(text, params);
    return result.rows as T[];
}
