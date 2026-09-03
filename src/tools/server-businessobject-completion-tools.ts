import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { SimplifierCompletionNode } from "../client/types.js";
import { wrapToolResult } from "./toolresult.js";

/** A resolved path is only expanded fully (nested children included, arbitrary depth) if its
 * serialized size stays under this many bytes; otherwise a one-level, names-only outline of its
 * immediate children is returned instead. Keeps responses bounded for Business Objects with very
 * large dependencies (e.g. SQL connectors with hundreds of calls) — request a deeper path to
 * drill into a specific child instead. */
const MAX_FULLY_EXPANDED_BYTES = 60_000;

function truncateDoc(doc: string | undefined, maxLen = 160): string | undefined {
  if (!doc) return undefined;
  const line = doc.split("\n")[0].trim();
  if (!line) return undefined;
  return line.length > maxLen ? line.slice(0, maxLen - 1) + "…" : line;
}

/** One level of {name, kind, doc} for browsing/discovery — cheap regardless of subtree size. */
function outlineEntry(node: SimplifierCompletionNode): Record<string, unknown> {
  const entry: Record<string, unknown> = { name: node.name, kind: node.kind };
  const doc = truncateDoc(node.doc);
  if (doc) entry.doc = doc;
  if (node.children) {
    entry.childCount = node.children.length;
    entry.children = node.children.map(c => ({ name: c.name, kind: c.kind }));
  } else if (node.kind === "function") {
    entry.returnType = node.returnType;
  } else if (node.kind === "property") {
    entry.typeExpr = node.typeExpr;
  }
  return entry;
}

function resolvePath(root: SimplifierCompletionNode[], path: string): SimplifierCompletionNode | undefined {
  const segments = path.split(".").map(s => s.trim()).filter(Boolean);
  let candidates = root;
  let found: SimplifierCompletionNode | undefined;
  for (const segment of segments) {
    found = candidates.find(n => n.name === segment);
    if (!found) return undefined;
    candidates = found.children || [];
  }
  return found;
}

/** Full detail for a resolved path: the node itself if it's a leaf (function/property), or its
 * subtree fully expanded (arbitrary depth, e.g. an OData entity set's `props` sub-module) if that
 * stays within the size budget, otherwise a compact outline of the immediate children (with a
 * hint to drill further). */
function detailForPath(node: SimplifierCompletionNode): Record<string, unknown> {
  if (!node.children) {
    return node as unknown as Record<string, unknown>;
  }
  const full = { name: node.name, kind: node.kind, doc: node.doc, children: node.children };
  if (Buffer.byteLength(JSON.stringify(full)) <= MAX_FULLY_EXPANDED_BYTES) {
    return full;
  }
  return {
    name: node.name,
    kind: node.kind,
    doc: node.doc,
    truncated: true,
    note: `This entry has ${node.children.length} children; showing an outline instead of full details. Request a deeper path (e.g. "<this path>.<childName>") to get full details for one specific child.`,
    children: node.children.map(c => ({ name: c.name, kind: c.kind }))
  };
}

function extractTypeTokens(expr: string | undefined, into: Set<string>): void {
  if (!expr) return;
  const matches = expr.match(/[A-Za-z_][A-Za-z0-9_]*/g);
  if (matches) matches.forEach(m => into.add(m));
}

/** Walks an already-selected (detail) structure and collects every identifier-like token found
 * in its `typeExpr`/`returnType` fields — candidates for names in `definitions`. */
function collectReferencedTypeNames(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach(v => collectReferencedTypeNames(v, into));
    return;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.typeExpr === "string") extractTypeTokens(obj.typeExpr, into);
    if (typeof obj.returnType === "string") extractTypeTokens(obj.returnType, into);
    for (const [key, v] of Object.entries(obj)) {
      if (key === "typeExpr" || key === "returnType") continue;
      collectReferencedTypeNames(v, into);
    }
  }
}

/** Resolves the transitive closure of type definitions reachable from the given seed names
 * (following typeExpr references inside each definition's properties). */
function resolveDefinitionsClosure(definitions: SimplifierCompletionNode[], seedNames: Set<string>): SimplifierCompletionNode[] {
  const byName = new Map(definitions.map(d => [d.name, d]));
  const resolved = new Map<string, SimplifierCompletionNode>();
  const queue = [...seedNames];
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (resolved.has(name)) continue;
    const def = byName.get(name);
    if (!def) continue;
    resolved.set(name, def);
    const refs = new Set<string>();
    collectReferencedTypeNames(def.properties, refs);
    for (const ref of refs) {
      if (!resolved.has(ref)) queue.push(ref);
    }
  }
  return [...resolved.values()];
}

export function registerServerBusinessObjectCompletionTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolName = "businessobject-completions";
  server.tool(toolName,
    `# Get code completions available to a Business Object's functions

Returns the \`Simplifier.*\` API surface (connectors, other Business Objects, plugins) available when writing
JavaScript code for functions of the given Business Object — scoped by its declared dependencies.

For **OData connectors**, this includes one entry per entity set with its \`query\`/\`update\`/\`create\`/\`delete\`
operations, and — once resolved via \`paths\` — the full entity set schema (record fields, query-builder
methods, create/update payload shapes) so the OData API can be addressed precisely instead of by guesswork.
For **other connectors and Business Objects**, it includes every call/function with its full parameter list
and types.

**Usage pattern (two steps, to keep responses small even for Business Objects with huge dependency graphs):**
1. Call with just \`businessObjectName\` to get a compact \`outline\` of everything reachable
   (e.g. \`Connector\` → connector names → their entity sets/calls).
2. Call again with \`paths\` — dot-separated paths into that outline, e.g.
   \`"Connector.<ConnectorName>.<EntitySetName>"\` or \`"BusinessObject.<Name>.<FunctionName>"\` — to get full
   signatures, parameter/property types and docs for exactly the entries needed, plus the referenced type
   definitions (e.g. the OData entity's record/query-builder/create-payload types).

Own functions of this Business Object are available under the \`CurrentBusinessObject\` path.`,
    {
      businessObjectName: z.string().describe("Business Object name"),
      paths: z.array(z.string()).optional().default([])
        .describe(`Dot-separated paths into the outline to fetch full details for, e.g. "Connector.Cap_OData_V4.Books" or "BusinessObject.SomeBO.someFunction". Omit (or leave empty) to get just the compact outline.`)
    },
    {
      title: "Get Business Object code completions",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ businessObjectName, paths }) => {
      return wrapToolResult(`get code completions for Business Object ${businessObjectName}`, async () => {
        const trackingKey = trackingToolPrefix + toolName;
        const completions = await simplifier.getServerBusinessObjectCompletions(businessObjectName, trackingKey);
        const root = completions.modules[0]?.children || [];
        const outline = root.map(outlineEntry);

        if (!paths || paths.length === 0) {
          return {
            businessObjectName,
            outline,
            hint: `Call again with "paths" (e.g. ["Connector.<ConnectorName>.<EntitySetName>"]) to get full details for specific entries.`
          };
        }

        const details: Record<string, unknown> = {};
        const errors: Record<string, string> = {};
        const referencedTypeNames = new Set<string>();

        for (const path of paths) {
          const node = resolvePath(root, path);
          if (!node) {
            errors[path] = `No completion entry found at path "${path}".`;
            continue;
          }
          const detail = detailForPath(node);
          details[path] = detail;
          collectReferencedTypeNames(detail, referencedTypeNames);
        }

        const definitions = resolveDefinitionsClosure(completions.definitions, referencedTypeNames);

        return {
          businessObjectName,
          outline,
          details,
          ...(Object.keys(errors).length > 0 ? { errors } : {}),
          definitions
        };
      });
    });
}
