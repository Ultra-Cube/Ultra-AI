#!/usr/bin/env bash
# preservation.sh — prove that no existing file was lost or changed.
# Usage:
#   scripts/preservation.sh manifest <git-ref> <out-file>     # SHA-256 manifest of every tracked file at <ref>
#   scripts/preservation.sh verify-tag <git-ref> <manifest>   # <ref> still matches the manifest byte-for-byte
#   scripts/preservation.sh verify-additive <base-ref> [head-ref]
#                                                             # between base and head there are ONLY added files
#   scripts/preservation.sh verify-moves <moves.tsv> [--post] # pre: every src exists+tracked, dst free;
#                                                             # post: src gone, dst present, same file set
# Exit code 0 = OK, 1 = violation (changed / deleted / renamed files), 2 = usage error.
set -euo pipefail

cmd="${1:-}"; shift || true

manifest() {
  local ref="$1" out="$2"
  {
    echo "# ultra-ai preservation manifest"
    echo "# ref: $ref"
    echo "# commit: $(git rev-parse "$ref^{commit}")"
    echo "# generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "# format: <sha256>  <path>   |   gitlink:<commit-sha>  <path>  (nested repo pointer, content NOT in this repo)"
    git ls-tree -r -z "$ref" | while IFS= read -r -d '' rec; do
      meta="${rec%%$'\t'*}"; f="${rec#*$'\t'}"
      read -r _mode type sha <<< "$meta"
      if [[ "$type" == "commit" ]]; then
        printf 'gitlink:%s  %s\n' "$sha" "$f"
      else
        printf '%s  %s\n' "$(git show "$ref:$f" | sha256sum | cut -d' ' -f1)" "$f"
      fi
    done
  } > "$out"
  echo "manifest written: $out ($(grep -vc '^#' "$out") entries, $(grep -c '^gitlink:' "$out") gitlinks)"
}

verify_tag() {
  local ref="$1" mf="$2" bad=0 total=0
  while IFS= read -r line; do
    [[ "$line" =~ ^# ]] && continue
    local want="${line%%  *}" f="${line#*  }"
    total=$((total+1))
    if [[ "$want" == gitlink:* ]]; then
      got="gitlink:$(git ls-tree "$ref" -- "$f" | awk '{print $3}')"
    else
      if ! got="$(git show "$ref:$f" 2>/dev/null | sha256sum | cut -d' ' -f1)"; then bad=$((bad+1)); echo "MISSING $f"; continue; fi
    fi
    [[ "$got" == "$want" ]] || { bad=$((bad+1)); echo "CHANGED $f"; }
  done < "$mf"
  echo "checked $total entries, violations: $bad"
  [[ $bad -eq 0 ]]
}

verify_additive() {
  local base="$1" head="${2:-HEAD}"
  local viol
  viol="$(git diff --name-status --no-renames "$base" "$head" | grep -v '^A' || true)"
  if [[ -n "$viol" ]]; then echo "VIOLATIONS (only additions are allowed):"; echo "$viol"; exit 1; fi
  echo "OK: $(git diff --name-status --no-renames "$base" "$head" | wc -l) files added, 0 changed, 0 deleted"
}

verify_moves() {
  local tsv="$1" post="${2:-}" bad=0 n=0
  [[ -f "$tsv" ]] || { echo "moves file not found: $tsv"; exit 2; }
  while IFS=$'\t' read -r src dst; do
    [[ -z "${src:-}" || "$src" == \#* ]] && continue
    n=$((n+1))
    if [[ "$post" == "--post" ]]; then
      if [[ -e "$src" ]]; then bad=$((bad+1)); echo "SRC-STILL-EXISTS $src"; fi
      if [[ ! -e "$dst" ]]; then bad=$((bad+1)); echo "DST-MISSING $dst"; continue; fi
      # compare relative file sets under src (recorded at move time via git) vs dst
      local a b
      a="$(git ls-files "$src" | sed "s|^$src/*||" | sort)"
      b="$(cd "$dst" 2>/dev/null && find . -type f | sed 's|^\./||' | sort)"
      if [[ "$a" != "$b" ]]; then
        bad=$((bad+1)); echo "FILESET-DIFF $src -> $dst"
        diff <(echo "$a") <(echo "$b") | head -10
      fi
    else
      if [[ ! -e "$src" ]]; then bad=$((bad+1)); echo "SRC-MISSING $src"; continue; fi
      if ! git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
        echo "WARN-UNTRACKED $src (git mv will fail; use git add first)"
      fi
      if [[ -e "$dst" ]]; then bad=$((bad+1)); echo "DST-COLLISION $dst"; fi
    fi
  done < "$tsv"
  echo "verify-moves${post:+ $post}: $n rows, violations: $bad"
  [[ $bad -eq 0 ]]
}

case "$cmd" in
  manifest)        [[ $# -eq 2 ]] || { sed -n 2,9p "$0"; exit 2; }; manifest "$@";;
  verify-tag)      [[ $# -eq 2 ]] || { sed -n 2,9p "$0"; exit 2; }; verify_tag "$@";;
  verify-additive) [[ $# -ge 1 ]] || { sed -n 2,9p "$0"; exit 2; }; verify_additive "$@";;
  verify-moves)    [[ $# -ge 1 ]] || { sed -n 2,9p "$0"; exit 2; }; verify_moves "$@";;
  *) sed -n 2,9p "$0"; exit 2;;
esac
