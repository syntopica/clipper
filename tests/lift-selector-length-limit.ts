import { splitSelectorList } from './split-selector-list'

// jsdom's selector engine (@asamuzakjp/dom-selector 9) refuses any selector
// longer than 2048 characters, and jsdom gives no way to raise it. Chrome has
// no such limit, and Defuddle removes clutter with one long comma-joined
// selector list, so under jsdom every extraction failed for a reason the
// extension never meets. A long list is evaluated one member at a time and the
// matches are returned in document order, which is what the browser does.
const LIMIT = 2048

export function liftSelectorLengthLimit(): void {
  for (const prototype of [Document.prototype, Element.prototype, DocumentFragment.prototype]) {
    const original = prototype.querySelectorAll
    Object.defineProperty(prototype, 'querySelectorAll', {
      configurable: true,
      writable: true,
      value: function querySelectorAll(this: ParentNode, selector: string) {
        if (selector.length <= LIMIT) return original.call(this, selector)
        const matches = new Set<Element>()
        for (const part of splitSelectorList(selector)) {
          for (const element of original.call(this, part)) matches.add(element)
        }
        const ordered = [...matches].sort((a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
        )
        // Callers only iterate, index or read `length`; an array serves all three.
        return ordered as unknown as NodeListOf<Element>
      },
    })
  }
}
