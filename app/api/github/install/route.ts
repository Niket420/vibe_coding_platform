import { NextResponse } from "next/server";

export async function GET() {
  const installUrl =
    "https://github.com/apps/codeforge-niket/installations/new";

  return NextResponse.redirect(installUrl);
}