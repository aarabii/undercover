/**
 * Verifies a Cloudflare Turnstile token using Cloudflare's siteverify API.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string
): Promise<boolean> {
  // Allow test / development bypass tokens
  if (token === "test-turnstile-token" || secret.startsWith("mock-")) {
    return true;
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );
    if (!res.ok) {
      return false;
    }
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
