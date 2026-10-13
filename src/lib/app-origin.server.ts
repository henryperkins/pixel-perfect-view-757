/** Redirects and emailed links use trusted configuration, never the Host header. */
export function appOrigin() {
  const value = process.env["PATTERN_APP_URL"] || "https://patterns.lakefrontdigital.io";
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  ) {
    throw new Error("Pattern's public URL is invalid.");
  }
  return url.origin;
}
