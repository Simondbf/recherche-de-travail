import fs from "fs";
import fsPromises from "fs/promises";
import * as archiverModule from "archiver";

// @ts-ignore
const archiver = archiverModule.default || archiverModule;

async function makeZip() {
  await fsPromises.mkdir("public", { recursive: true });
  const output = fs.createWriteStream("public/projet.zip");
  const archive = archiver("zip", { zlib: { level: 5 } });

  output.on("close", function () {
    console.log("Zip complete: " + archive.pointer() + " total bytes");
  });

  archive.on("error", function (err) {
    console.error("Archive error", err);
  });

  archive.pipe(output);

  archive.glob("**/*", {
    ignore: ["node_modules/**", "dist/**", ".git/**", "db.json", "public/projet.zip", "generate-zip.ts", "generate-zip.js"]
  });

  await archive.finalize();
}

makeZip().catch(console.error);
