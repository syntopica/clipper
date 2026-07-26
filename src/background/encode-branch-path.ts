export function encodeBranchPath(branch: string): string {
  return branch.split('/').map(encodeURIComponent).join('/')
}
