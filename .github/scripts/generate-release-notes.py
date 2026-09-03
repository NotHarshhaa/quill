#!/usr/bin/env python3
import os
import re
import subprocess
import sys

def get_git_output(cmd):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
        return res.stdout.strip()
    except Exception:
        return ""

def main():
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    current_tag = os.environ.get("GITHUB_REF_NAME", "latest")
    
    # Fetch all tags if available
    get_git_output("git fetch --tags --force 2>/dev/null")

    # Get list of all tags sorted by creation date
    raw_tags = get_git_output("git tag --sort=-creatordate").splitlines()
    tags = [t.strip() for t in raw_tags if t.strip()]

    prev_tag = None
    for i, tag in enumerate(tags):
        if tag == current_tag and i + 1 < len(tags):
            prev_tag = tags[i + 1]
            break

    if not prev_tag:
        # Fallback to previous tag reachable from HEAD~1
        fallback = get_git_output("git describe --tags --abbrev=0 HEAD~1 2>/dev/null")
        if fallback and "fatal" not in fallback:
            prev_tag = fallback

    if prev_tag:
        log_range = f"{prev_tag}..HEAD"
        compare_url = f"https://github.com/{repo}/compare/{prev_tag}...{current_tag}" if repo else ""
    else:
        log_range = "HEAD"
        compare_url = ""

    # Get commits format: hash|subject
    git_cmd = f'git log {log_range} --pretty=format:"%h|%s"'
    raw_commits = get_git_output(git_cmd).splitlines()

    feats = []
    fixes = []
    refactors = []
    chores = []
    docs = []
    others = []

    for line in raw_commits:
        line = line.strip()
        if not line or "|" not in line:
            continue
        parts = line.split("|", 1)
        sha = parts[0]
        msg = parts[1] if len(parts) > 1 else ""

        commit_link = f"[`{sha}`](https://github.com/{repo}/commit/{sha})" if repo else f"`{sha}`"
        entry = f"- {commit_link} {msg}"

        lower_msg = msg.lower()
        if re.search(r"(^|:\s*)(feat|feature)(\(.*\))?:", lower_msg):
            feats.append(entry)
        elif re.search(r"(^|:\s*)(fix|bugfix)(\(.*\))?:", lower_msg):
            fixes.append(entry)
        elif re.search(r"(^|:\s*)(refactor|perf)(\(.*\))?:", lower_msg):
            refactors.append(entry)
        elif re.search(r"(^|:\s*)(chore|ci|build|test|style)(\(.*\))?:", lower_msg):
            chores.append(entry)
        elif re.search(r"(^|:\s*)(docs)(\(.*\))?:", lower_msg):
            docs.append(entry)
        else:
            others.append(entry)

    md = []
    md.append("## 📱 Download Android APK")
    md.append(f"Download and install **`quill-{current_tag}.apk`** directly on your Android device from the **Assets** section below.\n")
    md.append("---")
    md.append("## 📋 What's Changed\n")

    if feats:
        md.append("### 🚀 Features")
        md.extend(feats)
        md.append("")

    if fixes:
        md.append("### 🐛 Bug Fixes")
        md.extend(fixes)
        md.append("")

    if refactors:
        md.append("### ♻️ Refactoring & Performance")
        md.extend(refactors)
        md.append("")

    if chores:
        md.append("### 📦 Build & Maintenance")
        md.extend(chores)
        md.append("")

    if docs:
        md.append("### 📝 Documentation")
        md.extend(docs)
        md.append("")

    if others:
        md.append("### 🔹 Other Changes")
        md.extend(others)
        md.append("")

    if not (feats or fixes or refactors or chores or docs or others):
        md.append("- General updates and improvements.\n")

    if compare_url and prev_tag:
        md.append(f"**Full Changelog**: [{prev_tag}...{current_tag}]({compare_url})")

    output_path = sys.argv[1] if len(sys.argv) > 1 else "RELEASE_NOTES.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")

    print(f"Release notes written to {output_path}")

if __name__ == "__main__":
    main()
