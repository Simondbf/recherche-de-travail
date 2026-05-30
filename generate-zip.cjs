const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

async function makeZip() {
  if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
  }
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
    ignore: ["node_modules/**", "dist/**", ".git/**", "db.json", "public/projet.zip", "generate-zip.ts", "generate-zip.cjs"]
  });

  await archive.finalize();
}

makeZip().catch(console.error);
