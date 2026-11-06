export function normalizeFinderUrl(value) {
  if (typeof value !== 'string' || value.length > 3000) throw new Error('Paste a GSMArena Phone Finder link.');
  const url = new URL(value.trim());
  if (url.origin !== 'https://www.gsmarena.com' || url.username || url.password ||
      !['/search.php3','/results.php3'].includes(url.pathname) || !url.search) {
    throw new Error('Use a filtered https://www.gsmarena.com Phone Finder or results link.');
  }
  url.pathname = '/results.php3';
  url.hash = '';
  return url.href;
}
