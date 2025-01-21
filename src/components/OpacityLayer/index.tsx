import React, { useState, useEffect, useRef } from 'react'

type Props = {
    children: React.ReactNode
    isShown: boolean
    threshold: number
    draggableElement: HTMLFormElement | null
}

export function OpacityLayer({ children, isShown, threshold, draggableElement }: Props) {
    const [opacity, setOpacity] = useState(() => isShown ? 1 : 0);
    const elementRef = useRef<HTMLDivElement>(null);

    let startY: number,
        deltaY = 0,
        initOpacity = opacity < 0.5 ? 0 : 1,
        canMove = false;

    useEffect(() => {
        setOpacity(isShown ? 1 : 0)

        if (!elementRef.current || !draggableElement) return
        draggableElement.addEventListener("touchstart", start);
        document.addEventListener("touchmove", move);
        document.addEventListener("touchend", end);


        return () => {
            draggableElement.removeEventListener("touchstart", start);
            document.removeEventListener("touchmove", move);
            document.removeEventListener("touchend", end);
        }
    }, [elementRef.current, isShown, draggableElement]);



    function start(e: TouchEvent) {
        canMove = true
        startY = e.touches[0].clientY;
        // initOpacity = opacity
    }

    function move(e: TouchEvent) {
        if (!canMove) return
        if (!elementRef.current) return
        deltaY = e.touches[0].clientY - startY;
        if (deltaY < 0) {
            setOpacity((Math.round((1 - Math.abs(deltaY) / threshold) * 10) / 10))
        }
        if (deltaY > 0) {
            setOpacity(Math.round(Math.abs(deltaY) / threshold * 10) / 10)
        }

    }
    function end() {
        if (!elementRef.current) return
        if (
            deltaY > threshold / 2 ||
            deltaY < -threshold / 2
        ) {
            if (deltaY > 0) {
                setOpacity(1)
                initOpacity = 1
            }
            if (deltaY < 0) {
                setOpacity(0)
                initOpacity = 0
            }
        } else {
            console.log("else", initOpacity)
            setOpacity(initOpacity)
        }
        canMove = false
    }

    return (
        <div ref={elementRef} style={{ opacity, transition: 'opacity 0.3s ease', display: opacity < 0.2 ? 'none' : 'block' }}>
            {children}
        </div>
    )
}
