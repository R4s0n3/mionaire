const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be set when building the Mionaire web client.",
  );
}

let parsed;
try {
  parsed = new URL(apiBaseUrl);
} catch {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid URL origin.");
}

if (
  (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
  parsed.pathname !== "/" ||
  parsed.search ||
  parsed.hash ||
  parsed.username ||
  parsed.password
) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be an http(s) origin without credentials or a path.",
  );
}
