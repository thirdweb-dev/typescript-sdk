import fetch from "node-fetch";

export default function (
  url: string,
  timeout: number,
  options?: any,
): Promise<any> {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("request timed out for all provided gateways")),
        timeout,
      ),
    ),
  ]);
}
