#!/usr/bin/env node
/**
 * scripts/wrap-suspense.mjs — one-off transform.
 *
 * For every `"use client"` page that uses useSearchParams(), wrap the
 * default export in a <Suspense> boundary so Next.js 16 prerender
 * doesn't bail.
 *
 *   "use client";
 *   export default function XxxPage() {
 *     const sp = useSearchParams();
 *     ...
 *   }
 *
 *   →
 *
 *   "use client";
 *   import { Suspense } from "react";
 *   ...
 *   function XxxPageInner() {
 *     const sp = useSearchParams();
 *     ...
 *   }
 *   export default function XxxPage() {
 *     return <Suspense fallback={null}><XxxPageInner /></Suspense>;
 *   }
 *
 * Also drops the `export const dynamic = "force-dynamic"` line we
 * injected previously — it has no effect on client components.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync('grep -rln "useSearchParams" src/app/ --include=*.tsx', {
  encoding: "utf8",
}).trim().split(/\r?\n/).filter(Boolean);

let patched = 0;
let skipped = 0;

for (const file of files) {
  let src = readFileSync(file, "utf8");

  if (/<Suspense /.test(src) && /function \w+PageInner\(/.test(src)) {
    skipped++;
    continue;
  }

  // Drop the force-dynamic line — doesn't help for client components.
  src = src.replace(/^export const dynamic = "force-dynamic";\s*\n+/m, "");

  // Find the default export function name.
  const defaultMatch = src.match(/export default function (\w+)\(/);
  if (!defaultMatch) {
    console.warn(`SKIP (no default export): ${file}`);
    skipped++;
    continue;
  }
  const fnName = defaultMatch[1];
  const innerName = `${fnName}Inner`;

  // Add `import { Suspense } from "react";` if not already present.
  if (!/from\s+"react"/.test(src)) {
    // Insert after the "use client" directive.
    src = src.replace(
      /^("use client";\s*\n+)/m,
      `$1import { Suspense } from "react";\n`,
    );
  } else if (!/\bSuspense\b.*from\s+"react"/.test(src)) {
    // React is imported but Suspense isn't. Add Suspense to the existing import.
    src = src.replace(
      /import\s+\{([^}]*)\}\s+from\s+"react";/,
      (m, imports) => `import { Suspense, ${imports.trim()} } from "react";`,
    );
  }

  // Rename the default export to Inner.
  src = src.replace(
    new RegExp(`export default function ${fnName}\\(`),
    `function ${innerName}(`,
  );

  // Append wrapped default export at the end of the file.
  src = src.replace(/\s*$/, "");
  src += `\n\nexport default function ${fnName}() {\n  return (\n    <Suspense fallback={null}>\n      <${innerName} />\n    </Suspense>\n  );\n}\n`;

  writeFileSync(file, src);
  patched++;
  console.log(`patched: ${file}`);
}

console.log(`\nDone. patched=${patched} skipped=${skipped}`);
