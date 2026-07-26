export class ClipConflictError extends Error {
  constructor(dirPath: string) {
    super(`a different clip already exists at ${dirPath}`)
    this.name = 'ClipConflictError'
  }
}
