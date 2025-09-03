export function getElementRect(element: Element): DOMRectReadOnly {
  let rect: DOMRectReadOnly | null = null;
  let observed = false;
  const observer = new IntersectionObserver(entries => {
    console.log(entries);
    for (const entry of entries) {
      rect = entry.boundingClientRect;
      console.log(rect);
    }

    observed = true;
    observer.disconnect();
  });

  observer.observe(element);

  while (!observed) {
    // pass
  }

  if (rect === null) {
    rect = element.getBoundingClientRect();
  }
  
  return rect;
}
