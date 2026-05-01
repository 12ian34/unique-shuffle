export const auth = {
  async getSession() {
    return { data: null }
  },
  handler() {
    return {
      GET: async () => new Response('Authentication has been removed.', { status: 410 }),
      POST: async () => new Response('Authentication has been removed.', { status: 410 }),
    }
  },
  middleware() {
    return () => undefined
  },
}
