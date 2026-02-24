#!/usr/bin/env node
/**
 * 한글 커밋 메시지용 (UTF-8 보장)
 * 사용: node scripts/commit-ko.js "feat: 한글 메시지"
 * 또는: yarn commit:ko "feat: 한글 메시지"
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const msg = process.argv.slice(2).join(" ") || "chore: update";
const msgPath = path.join(process.cwd(), ".commit-msg-tmp");
fs.writeFileSync(msgPath, msg + "\n", "utf8");
try {
  execSync("git", ["commit", "-F", msgPath], { stdio: "inherit" });
} finally {
  try {
    fs.unlinkSync(msgPath);
  } catch {}
}
