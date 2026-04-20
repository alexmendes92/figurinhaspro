import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const publicRoot = resolve(readArg("--public-root") || join(process.cwd(), "public"));
const publicBase = (process.env.R2_PUBLIC_BASE || "").replace(/\/$/, "");
const includeDirs = ["albums", "stickers", "covers", "flags"];
const concurrency = Number.parseInt(process.env.R2_AUDIT_CONCURRENCY || "32", 10);

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

function getLocalKeys() {
  return includeDirs
    .map((dir) => join(publicRoot, dir))
    .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
    .flatMap((dir) => walk(dir))
    .map(toKey);
}

function hasS3Credentials() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

async function listBucketKeysWithS3() {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const keys = new Set();
  let continuationToken;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of page.Contents ?? []) {
      if (item.Key) keys.add(item.Key);
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function checkKeysViaHttp(localKeys) {
  if (!publicBase) {
    throw new Error(
      "Missing R2_PUBLIC_BASE. Provide S3 credentials or a public base URL for HTTP audit mode."
    );
  }

  const missingInBucket = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= localKeys.length) return;

      const key = localKeys[index];
      const response = await fetch(`${publicBase}/${key}`, {
        method: "HEAD",
        redirect: "manual",
      });

      if (!response.ok) {
        missingInBucket.push({ key, status: response.status });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  return missingInBucket.sort((a, b) => a.key.localeCompare(b.key));
}

const localKeys = getLocalKeys();

if (hasS3Credentials()) {
  const bucketKeys = await listBucketKeysWithS3();
  const missingInBucket = localKeys.filter((key) => !bucketKeys.has(key)).sort();
  const extraInBucket = [...bucketKeys].filter((key) => !localKeys.includes(key)).sort();

  console.log(
    JSON.stringify(
      {
        mode: "s3",
        publicRoot,
        localCount: localKeys.length,
        bucketCount: bucketKeys.size,
        missingInBucket,
        extraInBucket,
      },
      null,
      2
    )
  );

  if (missingInBucket.length > 0) {
    process.exitCode = 1;
  }
} else {
  const missingInBucket = await checkKeysViaHttp(localKeys);

  console.log(
    JSON.stringify(
      {
        mode: "http-head",
        publicRoot,
        publicBase,
        localCount: localKeys.length,
        checkedCount: localKeys.length,
        missingInBucket,
        extraInBucket: null,
      },
      null,
      2
    )
  );

  if (missingInBucket.length > 0) {
    process.exitCode = 1;
  }
}
