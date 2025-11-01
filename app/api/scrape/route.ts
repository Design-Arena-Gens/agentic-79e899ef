import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_HTML_LENGTH = 15000;
const PREVIEW_LENGTH = 1200;

const sanitizeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch (error) {
    return null;
  }
};

const trimWhitespace = (value: string | undefined | null) =>
  value ? value.replace(/\s+/g, " ").trim() : "";

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url) {
      return NextResponse.json({ ok: false, error: "URL is required." }, { status: 400 });
    }

    const normalizedUrl = sanitizeUrl(url);

    if (!normalizedUrl) {
      return NextResponse.json({ ok: false, error: "Enter a valid http(s) URL." }, { status: 400 });
    }

    const timeController = new AbortController();
    const timeout = setTimeout(() => timeController.abort(), 8000);

    const response = await fetch(normalizedUrl, {
      signal: timeController.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MinimalWebScraper/1.0; +https://agentic-79e899ef.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Failed to load page (status ${response.status}).` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { ok: false, error: "The target URL must respond with HTML content." },
        { status: 400 }
      );
    }

    const html = await response.text();

    if (html.length > MAX_HTML_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `Response is too large to preview (>${Math.round(MAX_HTML_LENGTH / 1000)}kB).`,
        },
        { status: 413 }
      );
    }

    const $ = cheerio.load(html);

    const meta = {
      title: trimWhitespace($("title").first().text()),
      description: trimWhitespace($("meta[name='description']").attr("content")),
      robots: trimWhitespace($("meta[name='robots']").attr("content")),
      ogTitle: trimWhitespace($("meta[property='og:title']").attr("content")),
      ogDescription: trimWhitespace($("meta[property='og:description']").attr("content")),
    };

    const headings = $("h1, h2, h3")
      .map((_, element) => trimWhitespace($(element).text()))
      .get()
      .filter(Boolean);

    const htmlPreview = trimWhitespace($.root().text())
      .slice(0, PREVIEW_LENGTH)
      .concat(html.length > PREVIEW_LENGTH ? "…" : "");

    return NextResponse.json({ ok: true, meta, headings, htmlPreview });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Request timed out. Try again."
      : "Unable to scrape the requested page.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
