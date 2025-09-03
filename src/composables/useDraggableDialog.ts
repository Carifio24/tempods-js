import { onBeforeUnmount, Ref, watch } from "vue";
import { getElementRect } from "../utils/dom";

import { DragInfo } from "../types";

export interface UseDraggableDialogOptions {
  root: Ref<HTMLElement | null>;
  dragPredicate?: (element: HTMLElement) => boolean;
  dialogSelector?: string;
  scrimSelector?: string;
}

export function useDraggableDialog(options: UseDraggableDialogOptions) {

  const root = options.root;
  const dialogSelector = options.dialogSelector ?? ".v-dialog.v-overlay--active";
  const scrimSelector = options.scrimSelector ?? ".v-overlay__scrim";

  let dragInfo: DragInfo | null = null;
  type MouseEventHandler = (event: MouseEvent) => void;
  let mousedown: MouseEventHandler | null = null;
  let mouseup: MouseEventHandler | null = null;
  let mousemove: MouseEventHandler | null = null;

  function removeListeners(element: HTMLElement) {
    if (mousedown) {
      element.removeEventListener("mousedown", mousedown);
    }
    if (mouseup) {
      element.removeEventListener("mouseup", mouseup);
    }
    if (mousemove) {
      element.removeEventListener("mousemove", mousemove);
    }
  }

  function setupDraggable(element: HTMLElement) {
    removeListeners(element);

    let dragging = false;

    mousedown = (event: MouseEvent) => {
      if (options.dragPredicate && !options.dragPredicate(event.target as HTMLElement)) {
        element.style.cursor = "";
        return;
      }
      dragging = true;

      element.style.cursor = "grabbing";
      const closestDialog = element.closest(dialogSelector);
      if (event.button === 0 && closestDialog != null) {
        const boundingRect = getElementRect(closestDialog);
        const d: DragInfo = {
          el: closestDialog as HTMLElement,
          title: element,
          mouseStartX: event.clientX,
          mouseStartY: event.clientY,
          elStartX: boundingRect.left,
          elStartY: boundingRect.top,
          overlays: document.querySelectorAll(scrimSelector),
        };
        if (dragInfo && dragInfo.el) {
          d.oldTransition = dragInfo.el.style.transition;
        }
        if (d.el) {
          d.el.style.margin = "0";
          d.el.style.transition = "none";
          if (d.el.style.position !== "fixed") {
            d.el.style.position = "fixed";
            d.el.style.left = Math.min(
              Math.max(d.elStartX + event.clientX - d.mouseStartX, 0),
              window.innerWidth - boundingRect.width
            ) + "px";
            d.el.style.top = Math.min(
              Math.max(d.elStartY + event.clientY - d.mouseStartY , 0),
              window.innerHeight - boundingRect.height
            ) - 0.5 * window.innerHeight + "px";
          }
        }
        d.title.classList.add("dragging");
        d.overlays.forEach(overlay => (overlay as HTMLElement).style.display = "none");

        dragInfo = d;
      }
    };
    element.addEventListener("mousedown", mousedown);

    mousemove = (event: MouseEvent) => {
      if (options.dragPredicate && !options.dragPredicate(event.target as HTMLElement)) {
        element.style.cursor = "";
        return;
      }
      element.style.cursor = dragging ? "grabbing" : "grab";
      if (dragInfo === null || dragInfo.el == null) {
        return;
      }
      const boundingRect = getElementRect(dragInfo.el);
      dragInfo.el.style.left = Math.min(
        Math.max(dragInfo.elStartX + event.clientX - dragInfo.mouseStartX, 0),
        window.innerWidth - boundingRect.width
      ) + "px";
      dragInfo.el.style.top = Math.min(
        Math.max(dragInfo.elStartY + event.clientY - dragInfo.mouseStartY , 0),
        window.innerHeight - boundingRect.height
      ) - 0.5 * window.innerHeight + "px";
    };
    document.addEventListener("mousemove", mousemove);

    mouseup = (event: MouseEvent) => {
      if (options.dragPredicate && !options.dragPredicate(event.target as HTMLElement)) {
        element.style.cursor = "";
        return;
      }

      dragging = false;

      element.style.cursor = "grab";
      if (dragInfo === null) {
        return;
      }
      if (dragInfo.oldTransition && dragInfo.el) {
        dragInfo.el.style.transition = dragInfo.oldTransition;
      }
      dragInfo.el = undefined;
      dragInfo.title.classList.remove("dragging");
      dragInfo.overlays.forEach(overlay => (overlay as HTMLElement).style.display = '');
    };
    document.addEventListener("mouseup", mouseup);
    
    // If the window changes size, the dialog may be partially/completely out of bounds
    // We fix that here
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const dialogs = entry.target.querySelectorAll(dialogSelector);
        dialogs.forEach(d => {
          const dialog = d as HTMLElement;
          const boundingRect = getElementRect(dialog);
          dialog.style.left = Math.min(parseInt(dialog.style.left), window.innerWidth - boundingRect.width) + "px";
          dialog.style.top = Math.min(parseInt(dialog.style.top), window.innerHeight - boundingRect.height) + "px";
        });
      });
    });
    resizeObserver.observe(document.body);
  }

  if (root.value) {
    setupDraggable(root.value);
  }

  watch(root, newRoot => {
    if (newRoot !== null) {
      setupDraggable(newRoot);
    }
  });

  onBeforeUnmount(() => {
    const element = root.value;
    if (element) {
      removeListeners(element);
      element.style.cursor = "";
    }
  });

}
