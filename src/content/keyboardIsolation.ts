/**
 * Keyboard isolation so host-page shortcuts do not swallow sidebar form input.
 *
 * Two layers, because page shortcut handlers can listen in either phase:
 * a document capture listener (registered at document_start, so normally
 * ahead of the page's own) stops key events aimed at sidebar form fields,
 * and a bubble-phase stop on the host keeps every sidebar key event from
 * bubbling up to page listeners on document/window.
 */

/**
 * Capture-phase guard: key events targeting an input/textarea/select inside
 * the sidebar host never reach the page's own handlers. `getHost` is lazy
 * because this is registered before the host element exists.
 */
export function registerDocumentKeyboardIsolation(getHost: () => HTMLDivElement | null): void {
  const isEditableTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;

  const stopIfSidebarField = (event: KeyboardEvent): void => {
    const host = getHost();
    if (!host || !event.composedPath().includes(host)) {
      return;
    }
    if (isEditableTarget(event.composedPath()[0])) {
      event.stopImmediatePropagation();
    }
  };

  document.addEventListener('keydown', stopIfSidebarField, true);
  document.addEventListener('keyup', stopIfSidebarField, true);
}

/** Bubble-phase guard: no key event from inside the sidebar bubbles past its host. */
export function attachHostKeyboardBubbleStop(host: HTMLDivElement): void {
  const stopBubble = (event: Event): void => event.stopPropagation();
  host.addEventListener('keydown', stopBubble);
  host.addEventListener('keyup', stopBubble);
}
