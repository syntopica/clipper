export class NotFastForwardError extends Error {
  constructor() {
    super('ref update was not a fast forward')
    this.name = 'NotFastForwardError'
  }
}
