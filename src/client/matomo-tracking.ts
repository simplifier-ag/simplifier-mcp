

export const trackingToolPrefix = "MCP Tool: "
export const trackingResourcePrefix = "MCP Resource: "

export function trackingHeader(value: string): HeadersInit {
  return { "X-MCP-TRACKING-CONTEXT": value }
}


