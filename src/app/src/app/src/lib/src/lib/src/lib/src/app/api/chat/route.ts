import { NextRequest, NextResponse } from "next/server";
const FREETHEAI_BASE = "https://freetheai.org";
export async function POST(req: NextRequest) {
 try {
 const body = await req.json();
 const { messages, model = "fta/zai/glm-5.3", apiKey } = body;
 if (!apiKey) {
 return NextResponse.json({ error: "API key required" }, { status: 400 });
 }
 const response = await fetch(`${FREETHEAI_BASE}/chat/completions`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${apiKey}`,
 },
 body: JSON.stringify({
 model,
 messages,
 temperature: 0.9,
 max_tokens: 1024,
 stream: false,
 }),
 });
 if (!response.ok) {
 const errText = await response.text();
 return NextResponse.json(
 { error: `FreeTheAI error: ${response.status}` },
 { status: response.status }
 );
 }
 const data = await response.json();
 return NextResponse.json(data);
 } catch (error: any) {
 return NextResponse.json(
 { error: error.message || "Internal error" },
 { status: 500 }
 );
 }
}
