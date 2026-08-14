import { build } from "vite";
import react from "@vitejs/plugin-react";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(projectRoot, ".standalone-build");
const publicDir = path.join(projectRoot, "public");
const finalFile = path.join(projectRoot, "KnowForge-Demo.html");

const mimeTypes = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath, relativePath)));
    } else {
      files.push({ absolutePath, relativePath });
    }
  }

  return files;
}

function toDataUri(filePath, content) {
  const mime = mimeTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  return `data:${mime};base64,${content.toString("base64")}`;
}

function replacePublicAssetReferences(source, assets) {
  let output = source;
  for (const asset of assets) {
    const encoded = asset.relativePath.split("/").map(encodeURIComponent).join("/");
    const candidates = [
      `/${asset.relativePath}`,
      `./${asset.relativePath}`,
      `/${encoded}`,
      `./${encoded}`,
    ];
    for (const candidate of candidates) {
      output = output.split(candidate).join(asset.dataUri);
    }
  }
  return output;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await build({
  root: projectRoot,
  configFile: false,
  publicDir: false,
  base: "./",
  plugins: [react()],
  build: {
    outDir: outputDir,
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: path.join(projectRoot, "standalone.html"),
      output: {
        inlineDynamicImports: true,
        entryFileNames: "knowforge.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});

let builtHtml = await readFile(path.join(outputDir, "standalone.html"), "utf8");
const scriptMatch = builtHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const styleMatch = builtHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);

if (!scriptMatch) {
  throw new Error("The standalone JavaScript bundle was not found in the Vite output.");
}

const scriptPath = path.join(outputDir, scriptMatch[1].replace(/^\.\//, ""));
let script = await readFile(scriptPath, "utf8");
let style = "";

if (styleMatch) {
  const stylePath = path.join(outputDir, styleMatch[1].replace(/^\.\//, ""));
  style = await readFile(stylePath, "utf8");
}

const publicFiles = await listFiles(publicDir);
const assets = await Promise.all(
  publicFiles.map(async (file) => ({
    ...file,
    dataUri: toDataUri(file.absolutePath, await readFile(file.absolutePath)),
  })),
);

script = replacePublicAssetReferences(script, assets).replaceAll("</script>", "<\\/script>");
style = replacePublicAssetReferences(style, assets).replaceAll("</style>", "<\\/style>");

// The bundle is emitted as one self-contained chunk. Parse it before writing
// the final artifact so a malformed inline replacement cannot slip through.
new Function(script);

builtHtml = builtHtml
  .replace(scriptMatch[0], () => `<script type="module">${script}</script>`)
  .replace(styleMatch?.[0] ?? "", () => (style ? `<style>${style}</style>` : ""))
  .replace(
    "</head>",
    `<link rel="icon" href="${assets.find((asset) => asset.relativePath === "favicon.svg")?.dataUri ?? ""}" /></head>`,
  );

await writeFile(finalFile, builtHtml, "utf8");
await rm(outputDir, { recursive: true, force: true });

const stat = await readFile(finalFile);
console.log(`Created ${finalFile} (${(stat.length / 1024 / 1024).toFixed(2)} MiB)`);
