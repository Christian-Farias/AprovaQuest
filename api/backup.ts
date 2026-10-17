export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization') || ''
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  return new Response('Not implemented', { status: 501 })
}
