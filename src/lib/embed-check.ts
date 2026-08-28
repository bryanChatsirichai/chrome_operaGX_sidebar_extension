/**
 * Header-based iframe embed detection via X-Frame-Options and CSP frame-ancestors.
 */

const FRAME_ANCESTORS_PATTERN = /frame-ancestors\s+([^;]+)/i;

/** Returns true when CSP frame-ancestors disallows extension sidebar embedding. */
export function gxCspBlocksEmbedding(csp: string): boolean {
  const match = csp.match(FRAME_ANCESTORS_PATTERN);
  if (!match) {
    return false;
  }

  const directive = match[1].trim().toLowerCase();

  if (directive.includes("'none'")) {
    return true;
  }

  if (directive.includes("'self'")) {
    return true;
  }

  if (/\*/.test(directive)) {
    return false;
  }

  if (/\bhttps?:\s*\*/.test(directive)) {
    return false;
  }

  // Explicit host lists without wildcards block embedding from arbitrary parent pages.
  return directive.length > 0;
}

/** Parses response headers for iframe-blocking directives. */
export function gxHeadersBlockEmbedding(headers: Headers): boolean {
  const xfo = headers.get('x-frame-options');
  if (xfo) {
    const value = xfo.toLowerCase().trim();
    if (value === 'deny' || value === 'sameorigin') {
      return true;
    }
  }

  const cspValues: string[] = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-security-policy') {
      cspValues.push(value);
    }
  });

  return cspValues.some((csp) => gxCspBlocksEmbedding(csp));
}

/** Fetches URL headers and returns whether iframe embedding is likely allowed. */
export async function gxCheckEmbedAllowed(url: string): Promise<boolean> {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      credentials: 'omit'
    });

    if (!response.ok && (response.status === 405 || response.status === 501)) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        credentials: 'omit'
      });
    }

    return !gxHeadersBlockEmbedding(response.headers);
  } catch {
    // Network or CORS failure — attempt iframe load and rely on runtime verification.
    return true;
  }
}
