import { NextResponse } from "next/server";
import { toolsConfig } from "@/data/tools.config";

export async function GET() {
  return NextResponse.json(toolsConfig);
}
