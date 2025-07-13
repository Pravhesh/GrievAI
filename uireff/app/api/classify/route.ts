import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, labels } = await request.json();

    if (!text || !Array.isArray(labels) || labels.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
    const HF_API_KEY = process.env.HF_API_KEY;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: labels,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    const { labels: returnedLabels, scores } = data;

    return NextResponse.json({ label: returnedLabels[0], confidence: scores[0] });
  } catch (err: any) {
    console.error("Classify API error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
