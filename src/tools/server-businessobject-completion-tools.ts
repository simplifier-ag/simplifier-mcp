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
  } else if (node.kind === "raw" && node.source) {
    entry.sourceLength = node.source.length;
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
    // 'raw' nodes (OData): TypeScript declaration text referencing further types by name
    if (obj.kind === "raw" && typeof obj.source === "string") extractTypeTokens(obj.source, into);
    for (const [key, v] of Object.entries(obj)) {
      if (key === "typeExpr" || key === "returnType" || key === "source") continue;
      collectReferencedTypeNames(v, into);
    }
  }
}

/** Resolves the transitive closure of type definitions reachable from the given seed names
 * (following typeExpr references inside each definition's properties). */
function resolveDefinitionsClosure(definitions: SimplifierCompletionNode[], seedNames: Set<string>, rawRequested = false): SimplifierCompletionNode[] {
  const byName = new Map<string, SimplifierCompletionNode[]>();
  const addByName = (name: string, def: SimplifierCompletionNode) => {
    const list = byName.get(name);
    if (!list) byName.set(name, [def]);
    else if (!list.includes(def)) list.push(def);
  };
  for (const d of definitions) {
    addByName(d.name, d);
    // A 'raw' definition (OData TypeScript text, e.g. "ODataSharedTypes") may declare several types;
    // make each declared identifier resolvable to it.
    if (d.kind === "raw" && d.source) {
      for (const name of declaredIdentifiers(d.source)) addByName(name, d);
    }
  }
  const resolved = new Set<SimplifierCompletionNode>();
  const seen = new Set<string>();
  const queue = [...seedNames];
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (seen.has(name)) continue;
    seen.add(name);
    for (const def of byName.get(name) ?? []) {
      if (resolved.has(def)) continue;
      resolved.add(def);
      const refs = new Set<string>();
      collectReferencedTypeNames(def.properties, refs);
      if (def.kind === "raw" && def.source) extractTypeTokens(def.source, refs);
      for (const ref of refs) {
        if (!seen.has(ref)) queue.push(ref);
      }
    }
  }
  // Safety net: if raw text was requested but none of its references could be mapped to a raw definition
  // (e.g. the TypeScript declaration style changed in a way `declaredIdentifiers` does not understand),
  // return all raw definitions rather than silently dropping the types.
  const rawDefs = definitions.filter(d => d.kind === "raw");
  if (rawRequested && rawDefs.length > 0 && ![...resolved].some(d => d.kind === "raw")) {
    rawDefs.forEach(d => resolved.add(d));
  }
  return [...resolved];
}

function containsRawNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawNode);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return obj.kind === "raw" || Object.values(obj).some(containsRawNode);
  }
  return false;
}

/** Identifiers declared in a TypeScript declaration text. Deliberately lenient: not line-anchored, any
 * amount of whitespace, optional `export`/`declare`, and a broad keyword set — a miss only means the
 * definition is not found by that name (its own `name` always works as well). */
function declaredIdentifiers(source: string): string[] {
  const names: string[] = [];
  const re = /\b(?:interface|type|class|enum|namespace|function|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  for (const m of source.matchAll(re)) names.push(m[1]);
  return names;
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
   definitions (e.g. the OData entity's record/query-builder/create-payload types). For OData connectors both the
entity sets and these types are delivered as TypeScript declaration text (nodes with \`kind: "raw"\`, field \`source\`).

Own functions of this Business Object are available under the \`CurrentBusinessObject\` path.`,
    {
      businessObjectName: z.string().describe("Business Object name"),
      paths: z.array(z.string()).optional().default([])
        .describe(`Dot-separated paths into the outline to fetch full details for, e.g. "Connector.OData_V4.Books" or "BusinessObject.SomeBO.someFunction". Omit (or leave empty) to get just the compact outline.`)
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

        const definitions = resolveDefinitionsClosure(completions.definitions, referencedTypeNames, containsRawNode(details));

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
