interface ClipPathInput {
  clippedAt: string
  dirName: string
}

export function clipPath(input: ClipPathInput): string {
  const year = input.clippedAt.slice(0, 4)
  const month = input.clippedAt.slice(5, 7)
  return `clips/pending/${year}/${month}/${input.dirName}`
}
