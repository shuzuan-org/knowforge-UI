import { spawn } from "node:child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METACODE_BIN =
  process.env.METACODE_BIN || "C:\\Users\\EDY\\AppData\\Local\\metacode\\metacode.exe";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const args = [
        "exec",
        "--json",
        "--skip-git-repo-check",
        "--dangerously-bypass-approvals-and-sandbox",
        "-C",
        "C:\\Users\\EDY\\Documents\\UI",
      ];

      const child = spawn(METACODE_BIN, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
      });

      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      child.stdin.write(prompt);
      child.stdin.end();

      let buffer = "";

      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed);
            send(event);
          } catch {
            // non-JSON line, skip
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString().trim();
        if (text && !text.includes("Reading prompt from stdin")) {
          send({ type: "stderr", text });
        }
      });

      child.on("error", (err) => {
        send({ type: "error", text: `Failed to spawn metacode: ${err.message}` });
        controller.close();
      });

      child.on("close", (code) => {
        // flush remaining buffer
        if (buffer.trim()) {
          try {
            send(JSON.parse(buffer.trim()));
          } catch {
            // skip
          }
        }
        send({ type: "done", exitCode: code });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
