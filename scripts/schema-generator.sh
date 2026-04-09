#!/usr/bin/env bash
# ─── JSON Schema Generator ────────────────────────────────────────────────────
#
# Generates a JSON Schema file from a TypeScript interface using
# typescript-json-schema.  Only regenerates a schema when the source interface
# file has changed (tracked via an MD5 hash sidecar file).
#
# Usage: bash scripts/schema-generator.sh
# Called automatically by the `postinstall` npm script.
#
# Format for SCHEMAS entries:
#   "INTERFACE_FILE_PATH:INTERFACE_CLASS_NAME:OUTPUT_SCHEMA_PATH"
#
# The generator uses tsconfig.schema.json (not tsconfig.json) to avoid
# including handler.ts files that import the not-yet-generated schema —
# which would cause a circular bootstrap failure on a clean install.
# tsconfig.schema.json also inherits skipLibCheck:true, preventing type
# errors from the @types/glob ↔ minimatch version mismatch.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

declare -a SCHEMAS=(
  "src/api/items/create-item/spec/request.interface.ts:CreateItemRequest:src/api/items/create-item/spec/schemaValidator.json"
  "src/api/items/update-item/spec/request.interface.ts:UpdateItemRequest:src/api/items/update-item/spec/schemaValidator.json"
)

# ─── Helper: compute MD5 cross-platform (macOS uses `md5 -q`, Linux `md5sum`) ─
compute_md5() {
  local file_path="$1"
  if command -v md5 &>/dev/null; then
    md5 -q "$file_path"
  else
    md5sum "$file_path" | awk '{print $1}'
  fi
}

# ─── Helper: resolve the typescript-json-schema binary ────────────────────────
# Prefers the local node_modules/.bin binary (installed as a devDependency),
# then falls back to a globally installed binary.
resolve_tjs_bin() {
  local local_bin
  local_bin="$(dirname "$0")/../node_modules/.bin/typescript-json-schema"
  if [[ -x "$local_bin" ]]; then
    echo "$local_bin"
  elif command -v typescript-json-schema &>/dev/null; then
    echo "typescript-json-schema"
  else
    echo ""
  fi
}

# ─── Helper: regenerate a single schema if the source interface changed ────────
generate_schema_if_changed() {
  local interface_file="$1"
  local schema_class="$2"
  local output_schema="$3"
  local hash_sidecar="${output_schema}.md5"

  local current_hash
  current_hash=$(compute_md5 "$interface_file")
  local previous_hash=""
  [[ -f "$hash_sidecar" ]] && previous_hash=$(cat "$hash_sidecar")

  if [[ "$current_hash" == "$previous_hash" ]]; then
    echo "  [skip] Schema up-to-date: $output_schema"
    return
  fi

  local tjs_bin
  tjs_bin=$(resolve_tjs_bin)

  if [[ -z "$tjs_bin" ]]; then
    if [[ -f "$output_schema" ]]; then
      echo "  [warn] typescript-json-schema not found — using committed schema: $output_schema"
    else
      echo "  [error] typescript-json-schema not found and no committed schema exists: $output_schema"
      echo "          Install it with: npm install -g typescript-json-schema"
      exit 1
    fi
    return
  fi

  echo "  [gen]  Regenerating schema: $output_schema"

  # Resolve the project root (one level up from the scripts/ directory).
  local project_root
  project_root="$(cd "$(dirname "$0")/.." && pwd)"
  local tsconfig_path="$project_root/tsconfig.schema.json"

  local stderr_output
  # Pass tsconfig.schema.json instead of the interface file directly so that the
  # generator inherits skipLibCheck:true and avoids @types/glob type errors
  # caused by the minimatch version mismatch pulled in by serverless.
  if stderr_output=$("$tjs_bin" \
    --titles \
    --required \
    --noExtraProps \
    "$tsconfig_path" \
    "$schema_class" \
    -o "$output_schema" 2>&1 >/dev/null); then
    echo "$current_hash" > "$hash_sidecar"
    echo "  [done] Schema written: $output_schema"
  else
    # Generator failed — fall back to the committed schema if it exists.
    if [[ -f "$output_schema" ]]; then
      echo "  [warn] Schema regeneration encountered an issue — using committed schema: $output_schema"
      echo "         Run 'npm run schema' once the environment is fully set up to regenerate."
    else
      echo "  [error] Schema generation failed and no committed schema exists: $output_schema"
      echo "          Generator output:"
      echo "$stderr_output" | sed 's/^/          /'
      exit 1
    fi
  fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
echo "→ Running schema generator…"

for schema_entry in "${SCHEMAS[@]}"; do
  IFS=":" read -r -a parts <<< "$schema_entry"
  generate_schema_if_changed "${parts[0]}" "${parts[1]}" "${parts[2]}"
done

echo "→ Schema generation complete."
