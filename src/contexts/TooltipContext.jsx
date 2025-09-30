import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../hooks/useI18n.js'

const TooltipContext = createContext()

/**
 * Tooltip component that renders using Portal for proper positioning
 */
function TooltipPortal({ isVisible, content, targetElement, onHide }) {
    const tooltipRef = useRef(null)
    const arrowRef = useRef(null)

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

            // Check if tooltip is inside a dialog
            const parentDialog = targetElement.closest('dialog[open]')
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
                arrowOffset = left
                left = spacing
                arrowOffset = arrowOffset - left
            } else if (left + tooltipRect.width > window.innerWidth) {
                arrowOffset = left
                left = window.innerWidth - tooltipRect.width - spacing
                arrowOffset = arrowOffset - left
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
    }, [isVisible, targetElement, content])

    if (!isVisible || !content) return null

    // Determine where to render the portal
    const parentDialog = targetElement?.closest('dialog[open]')
    const portalTarget = parentDialog || document.body

    return createPortal(
        <div
            ref={tooltipRef}
            className="tooltip-panel visible"
            onClick={onHide}
        >
            {content}
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
    const [tooltipState, setTooltipState] = useState({
        isVisible: false,
        content: '',
        targetElement: null
    })
    const t = useI18n()

    // Handle scroll to close tooltip
    useEffect(() => {
        if (!tooltipState.isVisible) return

        const handleScroll = () => {
            setTooltipState({
                isVisible: false,
                content: '',
                targetElement: null
            })
        }

        // Listen to scroll on window and all scrollable containers
        window.addEventListener('scroll', handleScroll, true) // Use capture phase to catch all scrolls

        return () => {
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [tooltipState.isVisible])

    // Handle all tag clicks globally
    useEffect(() => {
        const handleTagClick = (event) => {
            const clickedTag = event.target.closest('.tag')
            if (!clickedTag) return

            const tooltipId = clickedTag.dataset.tooltipId
            if (!tooltipId) return

            event.preventDefault()
            event.stopPropagation()

            // If clicking the same tag that's already active, hide tooltip
            if (clickedTag === tooltipState.targetElement && tooltipState.isVisible) {
                setTooltipState({
                    isVisible: false,
                    content: '',
                    targetElement: null
                })
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

        // Handle clicks outside tags to hide tooltip
        const handleClickOutside = (event) => {
            if (!tooltipState.isVisible) return

            const clickedTag = event.target.closest('.tag')
            if (!clickedTag) {
                setTooltipState({
                    isVisible: false,
                    content: '',
                    targetElement: null
                })
            }
        }

        document.addEventListener('click', handleTagClick)
        document.addEventListener('click', handleClickOutside)

        return () => {
            document.removeEventListener('click', handleTagClick)
            document.removeEventListener('click', handleClickOutside)
        }
    }, [tooltipState.isVisible, tooltipState.targetElement, t])

    const showTooltip = (tooltipId, targetElement) => {
        const content = t(tooltipId)
        setTooltipState({
            isVisible: true,
            content,
            targetElement
        })
    }

    const hideTooltip = () => {
        setTooltipState({
            isVisible: false,
            content: '',
            targetElement: null
        })
    }

    return (
        <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
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
