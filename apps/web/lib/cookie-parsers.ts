type ParsedCookie = {
  domain: string;
  name: string;
  value: string;
  type: "cookie";
};

export function parseNetscapeCookies(text: string): ParsedCookie[] {
  const lines = text.split("\n");
  const cookies: ParsedCookie[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const fields = trimmed.split("\t");

    if (fields.length < 7) {
      throw new Error(`Malformed Netscape cookie line: expected 7+ tab-separated fields, got ${fields.length}`);
    }

    cookies.push({
      domain: fields[0],
      name: fields[5],
      value: fields[6],
      type: "cookie",
    });
  }

  return cookies;
}

export function parseJsonCookies(text: string): ParsedCookie[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array of cookie objects");
  }

  return parsed.map((item: unknown, index: number) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("domain" in item) ||
      !("name" in item) ||
      !("value" in item)
    ) {
      throw new Error(`Cookie at index ${index} is missing required fields (domain, name, value)`);
    }

    const { domain, name, value } = item as { domain: string; name: string; value: string };

    return {
      domain: domain.startsWith(".") ? domain.slice(1) : domain,
      name,
      value: String(value),
      type: "cookie" as const,
    };
  });
}
