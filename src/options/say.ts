export function say(message: string): void {
  ;(document.getElementById('status') as HTMLElement).textContent = message
}
