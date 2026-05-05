import dns from "node:dns/promises";
import net from "node:net";

const isBlockedIPAddress = (ip: string) => {
  if (!net.isIP(ip)) return false;

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
};

export const assertPublicHttpUrl = async (value: string) => {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("URL inválida");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Solo se permiten URLs http/https");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("No se permiten destinos locales");
  }

  if (net.isIP(hostname) && isBlockedIPAddress(hostname)) {
    throw new Error("No se permiten IPs privadas o locales");
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.some(({ address }) => isBlockedIPAddress(address))) {
    throw new Error("El destino resuelve a una IP privada o local");
  }

  return parsed.toString();
};
