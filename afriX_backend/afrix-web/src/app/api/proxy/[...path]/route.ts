import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api/v1";

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const subPath = path.join("/");
    const search = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/${subPath}${search}`;

    // Read httpOnly cookies on the server
    const adminToken = request.cookies.get("admin_token")?.value;
    const merchantToken = request.cookies.get("merchant_token")?.value;
    const customerToken = request.cookies.get("customer_token")?.value;
    const token = adminToken || merchantToken || customerToken;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "cookie" && lower !== "connection") {
        headers.set(key, value);
      }
    });

    if (token && !headers.has("authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined;

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "content-encoding" && lower !== "content-length") {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error("[BFF Proxy] Error forwarding request:", error.message);
    return NextResponse.json(
      { success: false, message: "Backend proxy error", error: error.message },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
