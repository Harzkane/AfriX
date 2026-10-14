import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, role } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
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
