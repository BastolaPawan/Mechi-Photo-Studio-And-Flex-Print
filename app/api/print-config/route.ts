import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER?.trim() || null,
    contactEmail: process.env.CONTACT_EMAIL?.trim() || null,
  });
}
