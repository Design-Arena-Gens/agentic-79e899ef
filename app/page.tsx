"use client";

import { FormEvent, useState } from "react";

type ScrapeResult = {
  ok: true;
  meta: {
    title: string;
    description: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
  };
  headings: string[];
  htmlPreview: string;
};

type ScrapeError = { ok: false; error: string };

export default function Home() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<ScrapeResult | ScrapeError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as ScrapeResult | ScrapeError;
      setResult(data);
    } catch (error) {
      setResult({ ok: false, error: "Unexpected error while scraping." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Minimal Web Scraper</h1>
      <p>Fetch metadata, headings, and a clean HTML preview from any public page.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="url"
          required
          placeholder="https://"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-label="URL to scrape"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Scraping…" : "Scrape"}
        </button>
      </form>

      {result && (
        <section>
          {!result.ok && <p role="alert">{result.error}</p>}
          {result.ok && (
            <div>
              <div className="code-tag">Metadata</div>
              <ul>
                <li>
                  <strong>Title:</strong> {result.meta.title || "—"}
                </li>
                <li>
                  <strong>Description:</strong> {result.meta.description || "—"}
                </li>
                <li>
                  <strong>Robots:</strong> {result.meta.robots || "—"}
                </li>
                <li>
                  <strong>OG Title:</strong> {result.meta.ogTitle || "—"}
                </li>
                <li>
                  <strong>OG Description:</strong> {result.meta.ogDescription || "—"}
                </li>
              </ul>

              <div className="code-tag" style={{ marginTop: "1.5rem" }}>
                Headings
              </div>
              <ul>
                {result.headings.length === 0 && <li>No headings found.</li>}
                {result.headings.map((heading, index) => (
                  <li key={index}>{heading}</li>
                ))}
              </ul>

              <div className="code-tag" style={{ marginTop: "1.5rem" }}>
                HTML Preview
              </div>
              <pre>{result.htmlPreview}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
