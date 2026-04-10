await Bun.build({
  entrypoints: ["./src/index.ts", "./src/hono/index.ts"],
  outdir: "./build",
});
