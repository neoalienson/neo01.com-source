export function parseUrl(urlString) {
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port || '',
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      searchParams: Array.from(url.searchParams.entries())
    };
  } catch (e) {
    return null;
  }
}