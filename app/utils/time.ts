export const formatTs = (ts: string) =>
    new Intl.DateTimeFormat("nb-NO", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date(ts));

export const formatTsNoTime = (ts: string) =>
    new Intl.DateTimeFormat("nb-NO", {
            timeZone: "Europe/Oslo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
    }).format(new Date(ts));