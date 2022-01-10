export function generateSearchString(params: Record<string, unknown>): string {
  const keys = Object.keys(params);
  return keys.reduce((url, key) => {
    let res = "";
    if (params[key]) {
      if (/^\?\w/.test(url)) res = "&";
      res += `${key}=:${key}`;
    }
    return url + res;
  },'?');
}
