export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a destination URL according to the security policy:
 * - Must be HTTPS only
 * - Must have a hostname
 * - Rejects http:, javascript:, data:, file: and other non-https schemes
 * - Rejects empty strings, malformed URLs, control characters
 * - Rejects embedded credentials
 */
export function validateDestinationUrl(url: string): ValidationResult {
  if (!url || url.trim() === "") {
    return { valid: false, error: "La URL es obligatoria" };
  }

  // Reject control characters
  if (/[\x00-\x1f\x7f]/.test(url)) {
    return { valid: false, error: "La URL contiene caracteres de control" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "URL malformada" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Solo se permiten URLs HTTPS" };
  }

  if (!parsed.hostname) {
    return { valid: false, error: "La URL debe tener un hostname" };
  }

  // Reject embedded credentials
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "No se permiten credenciales embebidas en la URL",
    };
  }

  return { valid: true };
}
