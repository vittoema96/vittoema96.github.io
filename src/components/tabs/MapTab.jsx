import React, { useRef, useEffect } from 'react'
import Panzoom from '@panzoom/panzoom'

function MapTab({ isActive }) {
    const mapContainerRef = useRef(null)
    const mapImageRef = useRef(null)
    const panzoomInstanceRef = useRef(null)

    // Initialize Panzoom when tab becomes active
    useEffect(() => {
        if (isActive && mapImageRef.current && mapContainerRef.current) {
            const initializePanzoom = () => {
                // Clean up any existing instance
                if (panzoomInstanceRef.current) {
                    disposePanzoom()
                }

                // Create new Panzoom instance
                panzoomInstanceRef.current = Panzoom(mapImageRef.current, {
                    maxScale: 5,
                    startScale: 0.1, // really low zoom, panzoom will use the min zoom allowed
                    contain: 'outside',
                })

                // Add wheel event listener for zooming
                const handleWheel = panzoomInstanceRef.current.zoomWithWheel
                mapContainerRef.current.addEventListener('wheel', handleWheel)

                // Center the image after a short delay
                setTimeout(() => {
                    centerImage()
                })

                // Store the wheel handler for cleanup
                panzoomInstanceRef.current._wheelHandler = handleWheel
            }

            // Check if image is already loaded
            if (mapImageRef.current.complete) {
                initializePanzoom()
            } else {
                // Wait for image to load
                const handleImageLoad = () => {
                    initializePanzoom()
                    mapImageRef.current.onload = null // Clean up
                }
                mapImageRef.current.onload = handleImageLoad

                // Handle image load error
                mapImageRef.current.onerror = () => {
                    console.error('Failed to load map image')
                    mapImageRef.current.onload = null
                    mapImageRef.current.onerror = null
                }
            }
        } else if (!isActive) {
            // Dispose Panzoom when tab becomes inactive
            disposePanzoom()
        }

        // Cleanup on unmount
        return () => {
            disposePanzoom()
        }
    }, [isActive])

    // Center the image in the container
    const centerImage = () => {
        if (!panzoomInstanceRef.current || !mapContainerRef.current || !mapImageRef.current) {
            return
        }

        const containerRect = mapContainerRef.current.getBoundingClientRect()
        const imageRect = mapImageRef.current.getBoundingClientRect()
        const scale = panzoomInstanceRef.current.getScale()

        // Calculate the visual difference between the container's center and the image's center
        const deltaX_visual =
            containerRect.width / 2 - (imageRect.left - containerRect.left + imageRect.width / 2)
        const deltaY_visual =
            containerRect.height / 2 - (imageRect.top - containerRect.top + imageRect.height / 2)

        // To get the correct pan values, divide the desired visual movement by the current scale
        const panX = deltaX_visual / scale
        const panY = deltaY_visual / scale

        // Pan by a relative amount to move from the current position to the center
        panzoomInstanceRef.current.pan(panX, panY, {
            animate: false,
            relative: true,
        })
    }

    // Clean up Panzoom instance
    const disposePanzoom = () => {
        if (panzoomInstanceRef.current) {
            // Reset image transform
            if (mapImageRef.current) {
                mapImageRef.current.style.transform = ''
            }

            // Remove wheel event listener
            if (mapContainerRef.current && panzoomInstanceRef.current._wheelHandler) {
                mapContainerRef.current.removeEventListener('wheel', panzoomInstanceRef.current._wheelHandler)
            }

            // Destroy Panzoom instance
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