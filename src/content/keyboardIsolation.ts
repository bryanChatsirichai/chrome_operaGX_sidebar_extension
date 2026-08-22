/** Keyboard isolation so host-page shortcuts do not swallow sidebar form input. */
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

export function attachHostKeyboardBubbleStop(host: HTMLDivElement): void {
  const stopBubble = (event: Event): void => event.stopPropagation();
  host.addEventListener('keydown', stopBubble);
  host.addEventListener('keyup', stopBubble);
}
