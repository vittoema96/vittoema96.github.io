import React from 'react'
import { createPortal } from 'react-dom'

interface DialogPortalProps {
    children: React.ReactNode;
}

/**
 * Simple portal wrapper for HTML <dialog> elements.
 * Renders children into document.body to ensure proper overlay layering.
 */
function DialogPortal({ children }: Readonly<DialogPortalProps>) {
    if (typeof document === 'undefined') {
        return null
    }

    return createPortal(children, document.body)
}

export default DialogPortal

