import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { token, role, email, password } = body;
    let user = null;

    // Direct credentials login via server-to-server proxy so JWT never enters browser JS memory
    if (email && password) {
      const backendUrl =
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001/api/v1";

      const loginRes = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await loginRes.json();
      if (!loginRes.ok || !data.success) {
        return NextResponse.json(
          { success: false, message: data.message || "Invalid credentials" },
          { status: loginRes.status || 401 }
        );
      }

      user = data.data?.user;
      token = data.data?.tokens?.access_token;
      if (role === "admin" && user?.role !== "admin" && user?.role !== "super_admin") {
        return NextResponse.json(
          { success: false, message: "Access denied: Admin privileges required" },
          { status: 403 }
        );
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token or credentials required" },
        { status: 400 }
      );
    }

    const cookieName =
      role === "merchant"
        ? "merchant_token"
        : role === "customer"
        ? "customer_token"
        : "admin_token";

    const response = NextResponse.json({
      success: true,
      message: "Session cookie set successfully",
      data: { user },
    });

    response.cookies.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to establish session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Session cookies cleared",
    });

    // Clear all auth tokens with httpOnly
    const cookieNames = ["admin_token", "merchant_token", "customer_token"];
    for (const name of cookieNames) {
      response.cookies.set({
        name,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to clear session" },
      { status: 500 }
    );
  }
}
