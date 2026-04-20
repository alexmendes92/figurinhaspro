import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const dryRun = process.argv.includes("--dry-run");
const publicRoot = resolve(readArg("--public-root") || join(process.cwd(), "public"));
const includeDirs = ["albums", "stickers", "covers", "flags"];

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function toKey(file) {
  return relative(publicRoot, file).split(sep).join("/");
}

function getContentType(file) {
  const extension = extname(file).toLowerCase();

  switch (extension) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function existsInBucket(key) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );

    return true;
  } catch {
    return false;
  }
}

const localFiles = includeDirs
  .map((dir) => join(publicRoot, dir))
  .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
  .flatMap((dir) => walk(dir));

for (const file of localFiles) {
  const key = toKey(file);

  if (await existsInBucket(key)) {
    continue;
  }

  if (dryRun) {
    console.log(`[dry-run] upload ${key}`);
    continue;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: readFileSync(file),
      ContentType: getContentType(file),
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  console.log(`[uploaded] ${key}`);
}
