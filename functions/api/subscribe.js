const RESEND_API_BASE = "https://api.resend.com";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const resendRequest = (env, path, init) =>
  fetch(`${RESEND_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

const upsertContact = async (env, email, parentInterest) => {
  const properties = {
    source: "getdaso.com",
    parent_interest: parentInterest ? "true" : "false",
    submitted_at: new Date().toISOString(),
  };

  const body = JSON.stringify({
    email,
    unsubscribed: false,
    properties,
  });

  const createResponse = await resendRequest(env, "/contacts", {
    method: "POST",
    body,
  });

  if (createResponse.ok) {
    return createResponse;
  }

  if (createResponse.status !== 409 && createResponse.status !== 422) {
    return createResponse;
  }

  return resendRequest(env, `/contacts/${encodeURIComponent(email)}`, {
    method: "PATCH",
    body,
  });
};

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: "resend_not_configured" }, 503);
  }

  let formData;

  try {
    formData = await request.formData();
  } catch {
    return json({ error: "invalid_form" }, 400);
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const parentInterest = formData.has("parent_interest");

  if (!isValidEmail(email)) {
    return json({ error: "invalid_email" }, 400);
  }

  try {
    const response = await upsertContact(env, email, parentInterest);

    if (!response.ok) {
      return json({ error: "resend_error" }, 502);
    }

    return json({ ok: true });
  } catch {
    return json({ error: "resend_unavailable" }, 502);
  }
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ error: "method_not_allowed" }, 405);
}

export async function onRequestPut() {
  return json({ error: "method_not_allowed" }, 405);
}

export async function onRequestPatch() {
  return json({ error: "method_not_allowed" }, 405);
}

export async function onRequestDelete() {
  return json({ error: "method_not_allowed" }, 405);
}
