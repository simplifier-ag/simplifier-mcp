
import { config } from '../config.js';
import fs from "node:fs/promises";



export async function login() {
    const credentials: IBasicAuthCredentials = JSON.parse(await fs.readFile(config.credentialsFile!, "utf8"))
    return await genToken(config.simplifierBaseUrl, credentials)
}

async function genToken(baseUrl: string, credentials: IBasicAuthCredentials): Promise<string> {
    const response: Response = await fetch(`${baseUrl}/genToken/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(credentials),
    })
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return (await response.json()).result
}

interface IBasicAuthCredentials {
  user: string,
  pass: string
}

