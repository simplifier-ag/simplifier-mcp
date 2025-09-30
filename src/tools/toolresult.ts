import {CallToolResult} from "@modelcontextprotocol/sdk/types.js";


export async function wrapToolResult(caption: string, fn: () => any): Promise<CallToolResult> {
  try {
    const result = await fn()
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    }
  } catch (e) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({error: `Tool ${caption} failed: ${e}`})
      }],
      isError: true
    }
  }
}


