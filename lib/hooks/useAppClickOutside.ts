import { useOnClickOutside } from 'usehooks-ts';
import { RefObject } from 'react';

// Enhanced click outside hook with common app patterns
export function useAppClickOutside<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T> | RefObject<T>[],
  handler: () => void,
  enabled: boolean = true
) {
  const refArray = Array.isArray(refs) ? refs : [refs];
  
  useOnClickOutside(refArray, (event) => {
    if (enabled) {
      handler();
    }
  });
}

// Specific hooks for common use cases
export function useCloseOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  isOpen: boolean,
  onClose: () => void
) {
  useAppClickOutside(ref, onClose, isOpen);
}

export function useMenuClickOutside<T extends HTMLElement = HTMLElement>(
  menuRef: RefObject<T>,
  triggerRef: RefObject<HTMLElement>,
  isOpen: boolean,
  onClose: () => void
) {
  useAppClickOutside([menuRef, triggerRef], onClose, isOpen);
}

export function useModalClickOutside<T extends HTMLElement = HTMLElement>(
  modalRef: RefObject<T>,
  isOpen: boolean,
  onClose: () => void,
  closeOnOutsideClick: boolean = true
) {
  useAppClickOutside(modalRef, onClose, isOpen && closeOnOutsideClick);
}