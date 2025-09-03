export async function getElementRect(element: Element): Promise<DOMRectReadOnly> {
  let rect: DOMRectReadOnly | null = null;
  let resolveRectPromise: (value: DOMRectReadOnly | PromiseLike<DOMRectReadOnly>) => void;
  const rectPromise = new Promise<DOMRectReadOnly>((resolve, _reject) => {
    resolveRectPromise = resolve;
  });
  const observer = new IntersectionObserver(entries => {
    rect = entries[0].boundingClientRect;
    resolveRectPromise(rect);

    observer.disconnect();
  });
  observer.observe(element);

  return rectPromise;
}
