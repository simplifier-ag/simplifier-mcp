import {ReadResourceResult} from "@modelcontextprotocol/sdk/types.js";


export async function wrapResourceResult(uri: URL, fn: () => any, mimeType: string = "application/json"): Promise<ReadResourceResult> {
  try {
    const result = await fn()
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(result, null, 2),
        mimeType: mimeType,
      }]
    }
  } catch (e) {
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({error: `Could not get data! ${e}`}),
        mimeType: mimeType,
      }]
    }
  }
}