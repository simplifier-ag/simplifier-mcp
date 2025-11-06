

export const trackingToolPrefix = "MCP Tool: "
export const trackingResourcePrefix = "MCP Resource: "

export function trackingHeader(value: string | undefined): HeadersInit {
  return value? { "X-MCP-TRACKING-CONTEXT": value } : {}
}


