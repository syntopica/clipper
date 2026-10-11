// A GitHub API call that answered with a non-success status. The status and the
// response headers travel with the error, because deciding what to do next -
// give up on a revoked token, wait out a rate limit, retry a 5xx - needs both,
// and a status buried in a message string can only be recovered by parsing it.
export class GithubRequestError extends Error {
  readonly status: number
  readonly headers: Headers

  constructor(operation: string, response: Response) {
    super(`${operation} failed: ${response.status}`)
    this.name = 'GithubRequestError'
    this.status = response.status
    this.headers = response.headers
  }
}
