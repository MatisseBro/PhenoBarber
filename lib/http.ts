export class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413, message: string) {
    super(message)
  }
}

export async function readTextBody(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError(413, 'Requête trop grande')
  }

  const reader = request.body?.getReader()
  if (!reader) throw new RequestBodyError(400, 'Requête invalide')
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel()
        throw new RequestBodyError(413, 'Requête trop grande')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const text = await readTextBody(request, maxBytes)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new RequestBodyError(400, 'Requête invalide')
  }
}
