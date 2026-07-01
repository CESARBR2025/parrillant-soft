export const TIMEZONE = "America/Mexico_City";

export function getMexicoDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const partes = formatter.formatToParts(date);
  const year = partes.find((p) => p.type === "year")!.value;
  const month = partes.find((p) => p.type === "month")!.value;
  const day = partes.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

export function getMexicoTimeString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = formatter.formatToParts(date);
  const hour = partes.find((p) => p.type === "hour")!.value;
  const minute = partes.find((p) => p.type === "minute")!.value;
  return `${hour}:${minute}`;
}
