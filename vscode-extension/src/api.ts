import * as https from "https";
import * as http from "http";

export interface ApiResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function callApi(
  backendUrl: string,
  endpoint: string,
  body: object
): Promise<ApiResult> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const url = new URL(endpoint, backendUrl);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ success: true, data: JSON.parse(data) });
        } catch {
          resolve({ success: false, error: "Invalid JSON response from backend" });
        }
      });
    });

    req.on("error", (e) => {
      resolve({
        success: false,
        error: `Cannot connect to backend at ${backendUrl}. Is it running? (${e.message})`,
      });
    });

    req.setTimeout(120000, () => {
      req.destroy();
      resolve({ success: false, error: "Request timed out (120s). AI model may be slow." });
    });

    req.write(payload);
    req.end();
  });
}
