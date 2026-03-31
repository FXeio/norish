import { describe, expect, it } from "vitest";

import { parseNetscapeCookies, parseJsonCookies } from "@/lib/cookie-parsers";

describe("parseNetscapeCookies", () => {
  it("parses valid Netscape cookie file", () => {
    const input = `# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.tiktok.com\tTRUE\t/\tTRUE\t1790458842\tsessionid\tabc123
www.tiktok.com\tFALSE\t/\tFALSE\t1782747252\tmsToken\txyz789`;

    const result = parseNetscapeCookies(input);

    expect(result).toEqual([
      { domain: ".tiktok.com", name: "sessionid", value: "abc123", type: "cookie" },
      { domain: "www.tiktok.com", name: "msToken", value: "xyz789", type: "cookie" },
    ]);
  });

  it("skips comment lines and blank lines", () => {
    const input = `# comment
.example.com\tTRUE\t/\tTRUE\t0\tfoo\tbar

# another comment
.example.com\tTRUE\t/\tFALSE\t0\tbaz\tqux`;

    const result = parseNetscapeCookies(input);

    expect(result).toHaveLength(2);
  });

  it("throws on malformed line with fewer than 7 fields", () => {
    const input = `.example.com\tTRUE\t/\tTRUE`;

    expect(() => parseNetscapeCookies(input)).toThrow();
  });

  it("returns empty array for input with only comments", () => {
    const input = `# Netscape HTTP Cookie File
# comment only`;

    expect(parseNetscapeCookies(input)).toEqual([]);
  });
});

describe("parseJsonCookies", () => {
  it("parses valid JSON cookie array", () => {
    const input = JSON.stringify([
      { domain: ".example.com", name: "sid", value: "abc", expirationDate: 123 },
      { domain: "sub.example.com", name: "tok", value: "def", httpOnly: true },
    ]);

    const result = parseJsonCookies(input);

    expect(result).toEqual([
      { domain: "example.com", name: "sid", value: "abc", type: "cookie" },
      { domain: "sub.example.com", name: "tok", value: "def", type: "cookie" },
    ]);
  });

  it("strips leading dot from domain", () => {
    const input = JSON.stringify([{ domain: ".tiktok.com", name: "a", value: "b" }]);

    expect(parseJsonCookies(input)[0].domain).toBe("tiktok.com");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJsonCookies("not json")).toThrow();
  });

  it("throws on non-array JSON", () => {
    expect(() => parseJsonCookies('{"foo": "bar"}')).toThrow();
  });

  it("throws on cookie missing required fields", () => {
    const input = JSON.stringify([{ domain: ".example.com" }]);

    expect(() => parseJsonCookies(input)).toThrow();
  });
});
