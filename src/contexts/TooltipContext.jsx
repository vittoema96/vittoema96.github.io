import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../hooks/useI18n.js'

const TooltipContext = createContext()

// Constant for empty tooltip state to avoid recreating the same object
const EMPTY_TOOLTIP_STATE = {
    isVisible: false,
    content: '',
    targetElement: null
}

/**
 * Tooltip component that renders using Portal for proper positioning
 */
function TooltipPortal({ isVisible, content, targetElement, onHide }) {
    const tooltipRef = useRef(null)
    const arrowRef = useRef(null)

    // Memoize parent dialog lookup to avoid duplicate calculations
    const parentDialog = useMemo(
        () => targetElement?.closest('dialog[open]'),
        [targetElement]
    )
    const portalTarget = parentDialog || document.body

    useEffect(() => {
        if (!isVisible || !targetElement || !tooltipRef.current) return

        const positionTooltip = () => {
            const tooltip = tooltipRef.current
            const arrow = arrowRef.current
            if (!tooltip || !arrow) return

            const tagRect = targetElement.getBoundingClientRect()
            const tooltipRect = tooltip.getBoundingClientRect()
            const spacing = 12 // Space between the tag and the tooltip

            // Start with positioning above the target
            tooltip.className = 'tooltip-panel visible pos-top'
            let top = tagRect.top - tooltipRect.height - spacing
            let left = tagRect.left + tagRect.width / 2 - tooltipRect.width / 2

            // Get dialog positioning if inside one
            const dialogRect = parentDialog?.getBoundingClientRect()
            const dialogTop = dialogRect?.top || 0
            const dialogLeft = dialogRect?.left || 0

            // If it goes off the top of the screen, place it below instead
            if (top < 0) {
                tooltip.className = 'tooltip-panel visible pos-bottom'
                top = tagRect.bottom + spacing
            }

            // Prevent it from going off the left/right edges
            let arrowOffset = 0
            if (left < 0) {
                arrowOffset = left - spacing
                left = spacing
            } else if (left + tooltipRect.width > window.innerWidth) {
                arrowOffset = left - (window.innerWidth - tooltipRect.width - spacing)
                left = window.innerWidth - tooltipRect.width - spacing
            }

            // Position the arrow
            if (arrowOffset) {
                const offsetStr = arrowOffset > 0 ? `+ ${arrowOffset}px` : `- ${-arrowOffset}px`
                arrow.style.transform = `translateX(calc(-50% ${offsetStr}))`
            } else {
                arrow.style.transform = 'translateX(-50%)'
            }

            // Apply final positioning (relative to dialog if inside one)
            tooltip.style.top = `${top - dialogTop}px`
            tooltip.style.left = `${left - dialogLeft}px`
        }

        // Position immediately and on resize
        positionTooltip()
        window.addEventListener('resize', positionTooltip)

        return () => {
            window.removeEventListener('resize', positionTooltip)
        }
    }, [isVisible, targetElement, parentDialog])

    if (!isVisible || !content) return null

    // Split content by newlines and render as separate lines
    const lines = content.split('\n')

    return createPortal(
        <div
            ref={tooltipRef}
            className="tooltip-panel visible"
            onClick={onHide}
        >
            {lines.map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ))}
            <div ref={arrowRef} className="tooltip-arrow" />
        </div>,
        portalTarget
    )
}

export function useTooltip() {
    const context = useContext(TooltipContext)
    if (!context) {
        throw new Error('useTooltip must be used within TooltipProvider')
    }
    return context
}

export function TooltipProvider({ children }) {
    const [tooltipState, setTooltipState] = useState(EMPTY_TOOLTIP_STATE)
    const t = useI18n()

    // Memoize hide function to avoid recreating it on every render
    const hideTooltip = useCallback(() => {
        setTooltipState(EMPTY_TOOLTIP_STATE)
    }, [])

    // Handle scroll to close tooltip
    useEffect(() => {
        if (!tooltipState.isVisible) return

        const handleScroll = () => {
            hideTooltip()
        }

        // Listen to scroll on window and all scrollable containers
        window.addEventListener('scroll', handleScroll, true) // Use capture phase to catch all scrolls

        return () => {
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [tooltipState.isVisible, hideTooltip])

    // Handle all tag clicks globally - combined into single handler for efficiency
    useEffect(() => {
        const handleClick = (event) => {
            const clickedTag = event.target.closest('.tag')

            // If no tag was clicked and tooltip is visible, hide it
            if (!clickedTag) {
                if (tooltipState.isVisible) {
                    hideTooltip()
                }
                return
            }

            const tooltipId = clickedTag.dataset.tooltipId
            if (!tooltipId) return

            event.preventDefault()
            event.stopPropagation()

            // If clicking the same tag that's already active, hide tooltip
            if (clickedTag === tooltipState.targetElement && tooltipState.isVisible) {
                hideTooltip()
            } else {
                // Show tooltip for this tag
                const content = t(tooltipId)
                setTooltipState({
                    isVisible: true,
                    content,
                    targetElement: clickedTag
                })
            }
        }

        document.addEventListener('click', handleClick)

        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [tooltipState.isVisible, tooltipState.targetElement, t, hideTooltip])

    // Memoize show function to avoid recreating it on every render
    // Can accept either (tooltipId, targetElement) or (targetElement, content)
    const showTooltip = useCallback((arg1, arg2) => {
        let content, targetElement

        // If arg2 is a string, it's (targetElement, content)
        if (typeof arg2 === 'string') {
            targetElement = arg1
            content = arg2
        } else {
            // Otherwise it's (tooltipId, targetElement)
            const tooltipId = arg1
            targetElement = arg2
            content = t(tooltipId)
        }

        setTooltipState({
            isVisible: true,
            content,
            targetElement
        })
    }, [t])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({ showTooltip, hideTooltip }),
        [showTooltip, hideTooltip]
    )

    return (
        <TooltipContext.Provider value={contextValue}>
            {children}
            <TooltipPortal
                isVisible={tooltipState.isVisible}
                content={tooltipState.content}
                targetElement={tooltipState.targetElement}
                onHide={hideTooltip}
            />
        </TooltipContext.Provider>
    )
}
