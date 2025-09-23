import React, { useRef, useEffect } from 'react'
import Panzoom from '@panzoom/panzoom'

// TODO Map is working weird: Appearing only after zoom and not centered. why? indagare

function MapTab({ isActive }) {
    const mapContainerRef = useRef(null)
    const mapImageRef = useRef(null)
    const panzoomInstanceRef = useRef(null)

    useEffect(() => {
        if (isActive) {
            // Initialize when tab becomes active
            if (mapImageRef.current?.complete) {
                initializePanzoom()
            } else if (mapImageRef.current) {
                mapImageRef.current.onload = initializePanzoom
            }
        } else {
            // Clean up when tab becomes inactive
            disposePanzoom()
        }

        return () => disposePanzoom()
    }, [isActive])

    const initializePanzoom = () => {
        if (!mapImageRef.current || !mapContainerRef.current) return

        // Clean up existing instance
        if (panzoomInstanceRef.current) {
            disposePanzoom()
        }

        // Create Panzoom instance
        panzoomInstanceRef.current = Panzoom(mapImageRef.current, {
            maxScale: 5,
            startScale: 0.1,
            contain: 'outside',
        })

        // Add wheel listener
        mapContainerRef.current.addEventListener('wheel', panzoomInstanceRef.current.zoomWithWheel)

        // Center after delay
        setTimeout(centerImage)
    }

    const centerImage = () => {
        if (!panzoomInstanceRef.current || !mapContainerRef.current || !mapImageRef.current) {
            return
        }

        const containerRect = mapContainerRef.current.getBoundingClientRect()
        const imageRect = mapImageRef.current.getBoundingClientRect()
        const scale = panzoomInstanceRef.current.getScale()

        const deltaX_visual =
            containerRect.width / 2 - (imageRect.left - containerRect.left + imageRect.width / 2)
        const deltaY_visual =
            containerRect.height / 2 - (imageRect.top - containerRect.top + imageRect.height / 2)

        const panX = deltaX_visual / scale
        const panY = deltaY_visual / scale

        panzoomInstanceRef.current.pan(panX, panY, {
            animate: false,
            relative: true,
        })
    }

    const disposePanzoom = () => {
        if (panzoomInstanceRef.current) {
            // Safe cleanup
            if (mapImageRef.current) {
                mapImageRef.current.style.transform = ''
                mapImageRef.current.onload = null
            }

            panzoomInstanceRef.current.destroy()
            panzoomInstanceRef.current = null
        }
    }

    return (
        <section id="map-tabContent" className="tabContent">
            <div id="map-container" ref={mapContainerRef}>
                <img
                    id="map-image"
                    ref={mapImageRef}
                    src="/img/png/map.png"
                    alt="Zoomable Map"
                />
            </div>
        </section>
    )
}

export default MapTab