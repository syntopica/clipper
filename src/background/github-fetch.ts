export interface GithubContext {
  token: string
  owner: string
  repo: string
}

export async function githubFetch(
  context: GithubContext,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`https://api.github.com/repos/${context.owner}/${context.repo}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${context.token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}
