import { NextResponse } from "next/server";
import { groth16 } from "snarkjs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    if (!input) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const wasmPath = path.join(process.cwd(), "public", "zk", "circuit.wasm");
    const zkeyPath = path.join(process.cwd(), "public", "zk", "circuit_final.zkey");

    const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);

    return NextResponse.json({ proof, publicSignals });
  } catch (err: any) {
    console.error("Proof generation error", err);
    return NextResponse.json({ error: "Proof generation failed" }, { status: 500 });
  }
}
