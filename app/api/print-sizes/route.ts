import { NextResponse } from "next/server";
import { printSizes } from "@/data/print-sizes.config";

export async function GET() {
  return NextResponse.json({ sizes: printSizes });
}
