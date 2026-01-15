import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useMemo
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/** --- TYPES & CONTEXT --- **/

interface TooltipState {
    isVisible: boolean;
    content: string;
    targetElement?: HTMLElement | undefined;
}

interface TooltipContextValue {
    showTooltip: (content: string, targetElement: HTMLElement) => void;
    hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined)

export const useTooltip = () => {
    const context = useContext(TooltipContext)
    if (!context) {throw new Error('useTooltip must be used within TooltipProvider')}
    return context
}

const EMPTY_STATE: TooltipState = {
    isVisible: false,
    content: '',
    targetElement: undefined
}

/** --- PROVIDER COMPONENT --- **/

export function TooltipProvider({ children }: React.PropsWithChildren) {
    const { t } = useTranslation()
    const [tooltipState, setTooltipState] = useState<TooltipState>(EMPTY_STATE)

    // We use a Ref to track state for the global event listener.
    // This allows the listener to stay "stable" (not recreated) while still accessing fresh state.
    const stateRef = useRef(tooltipState)
    stateRef.current = tooltipState


    const showTooltip = useCallback((content: string, targetElement: HTMLElement) => {
        setTooltipState({ isVisible: true, content, targetElement })
    }, [])

    const hideTooltip = useCallback(() => {
        setTooltipState(EMPTY_STATE)
    }, [])

    // SCROLL LISTENER: Closes tooltip on any scroll
    useEffect(() => {
        if (!tooltipState.isVisible) {return}
        window.addEventListener('scroll', hideTooltip, true)
        return () => window.removeEventListener('scroll', hideTooltip, true)
    }, [tooltipState.isVisible, hideTooltip])

    // GLOBAL CLICK HANDLER: Handles all .tag clicks
    // TODO this should not be handled in here, but on Tag class...
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            const clickedTag = target.closest('.tag') as HTMLElement | null

            if (!clickedTag) {
                if (stateRef.current.isVisible) {hideTooltip()}
                return
            }

            const tooltipId = clickedTag.dataset["tooltipId"]
            if (!tooltipId) {return}

            event.preventDefault()
            event.stopPropagation()

            // Toggle logic
            const isSameElement = clickedTag === stateRef.current.targetElement
            if (isSameElement && stateRef.current.isVisible) {
                hideTooltip()
            } else {
                showTooltip(t(tooltipId), clickedTag)
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [hideTooltip, showTooltip]) // Dependencies are stable; listener is never recreated.

    const contextValue = useMemo(() => ({ showTooltip, hideTooltip }), [showTooltip, hideTooltip])

    return (
        <TooltipContext.Provider value={contextValue}>
            {children}
            <TooltipPortal {...tooltipState} onHide={hideTooltip} />
        </TooltipContext.Provider>
    )
}

/** --- PORTAL COMPONENT --- **/

interface TooltipPortalProps extends TooltipState {
    onHide: () => void;
}

function TooltipPortal({ isVisible, content, targetElement, onHide }: TooltipPortalProps) {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const arrowRef = useRef<HTMLDivElement>(null)

    // Lookup the correct portal target (Dialog or Body)
    const portalTarget = useMemo(() => {
        return targetElement?.closest('dialog[open]') || document.body
    }, [targetElement])

    // useLayoutEffect prevents the "flicker" by positioning BEFORE the browser paints.
    useLayoutEffect(() => {
        if (!isVisible || !targetElement || !tooltipRef.current) {return}

        const positionTooltip = () => {
            const tooltip = tooltipRef.current
            const arrow = arrowRef.current
            if (!tooltip || !arrow) {return}

            const tagRect = targetElement.getBoundingClientRect()
            const tooltipRect = tooltip.getBoundingClientRect()
            const spacing = 12

            // Calculate base viewport coordinates
            let top = tagRect.top - tooltipRect.height - spacing
            let left = tagRect.left + tagRect.width / 2 - tooltipRect.width / 2

            // Collision detection: Bottom flip
            let positionClass = 'pos-top'
            if (top < 10) {
                positionClass = 'pos-bottom'
                top = tagRect.bottom + spacing
            }

            // Collision detection: Horizontal overflow
            const margin = 10
            let arrowOffset = 0
            if (left < margin) {
                arrowOffset = left - margin
                left = margin
            } else if (left + tooltipRect.width > window.innerWidth - margin) {
                arrowOffset = (left + tooltipRect.width) - (window.innerWidth - margin)
                left = window.innerWidth - tooltipRect.width - margin
            }

            // Apply Classes
            tooltip.className = `tooltip-panel visible ${positionClass}`

            // Arrow logic
            arrow.style.transform = arrowOffset
                ? `translateX(calc(-50% + ${arrowOffset}px))`
                : 'translateX(-50%)'

            // Offset adjustment if inside a Dialog
            if (portalTarget instanceof HTMLDialogElement) {
                const dRect = portalTarget.getBoundingClientRect()
                top -= dRect.top
                left -= dRect.left
            }

            tooltip.style.top = `${top}px`
            tooltip.style.left = `${left}px`
        }

        positionTooltip()
        window.addEventListener('resize', positionTooltip)
        return () => window.removeEventListener('resize', positionTooltip)
    }, [isVisible, targetElement, portalTarget])

    return isVisible && content ?
        createPortal(
            <div ref={tooltipRef} className="tooltip-panel" onClick={onHide}>
                {content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {line}{i !== content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))}
                <div ref={arrowRef} className="tooltip-arrow" />
            </div>,
            portalTarget
        ) : null
}
