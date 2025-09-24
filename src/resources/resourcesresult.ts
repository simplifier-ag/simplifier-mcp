
export async function wrapResourceResult(uri: URL, fn: () => any) {
  try {
    const result = await fn()
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(result, null, 2),
        mimeType: "application/json"
      }]
    }
  } catch (e) {
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({error: `Could not get data! ${e}`}),
        mimeType: "application/json"
      }]
    }
  }
}