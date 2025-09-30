import React, { useRef, useEffect } from 'react'
import Panzoom from '@panzoom/panzoom'

function MapTab() {
    const mapContainerRef = useRef(null)
    const mapImageRef = useRef(null)
    const panzoomInstanceRef = useRef(null)

    useEffect(() => {
        // Initialize Panzoom when component mounts
        if (mapImageRef.current?.complete) {
            initializePanzoom()
        } else if (mapImageRef.current) {
            mapImageRef.current.onload = initializePanzoom
        }

        // Clean up when component unmounts
        return () => disposePanzoom()
    }, [])

    const initializePanzoom = () => {
        if (!mapImageRef.current || !mapContainerRef.current) return

        // Clean up existing instance
        if (panzoomInstanceRef.current) {
            disposePanzoom()
        }

        // Wait for next frame to ensure container has correct dimensions
        requestAnimationFrame(() => {
            if (!mapImageRef.current || !mapContainerRef.current) return

            // Calculate the scale to fit the map in the container
            const containerRect = mapContainerRef.current.getBoundingClientRect()
            const imageNaturalWidth = mapImageRef.current.naturalWidth
            const imageNaturalHeight = mapImageRef.current.naturalHeight

            // Ensure we have valid dimensions
            if (containerRect.width === 0 || containerRect.height === 0 ||
                imageNaturalWidth === 0 || imageNaturalHeight === 0) {
                console.warn('MapTab: Invalid dimensions, retrying...')
                setTimeout(() => initializePanzoom(), 100)
                return
            }

            // Calculate scale to fit container (zoom out to show entire map)
            const scaleX = containerRect.width / imageNaturalWidth
            const scaleY = containerRect.height / imageNaturalHeight
            const fitScale = Math.min(scaleX, scaleY)

            // Create Panzoom instance with calculated start scale
            panzoomInstanceRef.current = Panzoom(mapImageRef.current, {
                maxScale: 5,
                minScale: fitScale * 0.5, // Allow zooming out more
                startScale: fitScale,
                contain: 'outside',
            })

            // Add wheel listener
            mapContainerRef.current.addEventListener('wheel', panzoomInstanceRef.current.zoomWithWheel)

            // Center after a short delay to ensure transform is applied
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    centerImage()
                })
            })
        })
    }

    const centerImage = () => {
        if (!panzoomInstanceRef.current || !mapContainerRef.current || !mapImageRef.current) {
            console.warn('MapTab: Cannot center - missing refs')
            return
        }

        const containerRect = mapContainerRef.current.getBoundingClientRect()
        const imageRect = mapImageRef.current.getBoundingClientRect()
        const scale = panzoomInstanceRef.current.getScale()

        // Ensure we have valid dimensions
        if (containerRect.width === 0 || containerRect.height === 0) {
            console.warn('MapTab: Cannot center - invalid container dimensions')
            return
        }

        const deltaX_visual =
            containerRect.width / 2 - (imageRect.left - containerRect.left + imageRect.width / 2)
        const deltaY_visual =
            containerRect.height / 2 - (imageRect.top - containerRect.top + imageRect.height / 2)

        const panX = deltaX_visual / scale
        const panY = deltaY_visual / scale

        console.log('MapTab: Centering with', { scale, panX, panY, containerRect, imageRect })

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