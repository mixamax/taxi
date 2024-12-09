import { is } from "immutable";

export function swipe(element: HTMLElement, speed = 300, swipeHeight: number) {
    let startY: number,
        startTime: number,
        isCanMove = false,
        deltaY = 0,
        currentY = 0;

    element.addEventListener("touchstart", start);
    document.addEventListener("touchmove", move);
    document.addEventListener("touchend", end);

    function start(e: TouchEvent) {
        console.log("startY", e.touches[0].clientY);
        isCanMove = true;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        element.style.transition = "none";
        document.body.style.overflow = "hidden";

        console.log("swipeHeight", swipeHeight, "startY", startY);
    }

    function move(e: TouchEvent) {
        if (!isCanMove) return;
        console.log("canMove");
        deltaY = e.touches[0].clientY - startY;
        element.style.transform = `translateY(${currentY + deltaY}px)`;
        console.log("deltaY", deltaY);
    }
    function end() {
        const endTime = Date.now();
        const duration = endTime - startTime;
        document.body.style.overflow = "";
        element.style.transition = "transform 0.3s ease";

        if (
            duration < speed ||
            deltaY > swipeHeight / 2 ||
            deltaY < -swipeHeight / 2
        ) {
            if (deltaY > 0) {
                element.style.transform = `translateY(${0}px)`;
                currentY = 0;
            }
            if (deltaY < 0) {
                element.style.transform = `translateY(${-swipeHeight}px)`;
                currentY = -swipeHeight;
            }
        } else {
            element.style.transform = `translateY(${currentY}px)`;
            console.log("startY in the end", startY);
        }

        isCanMove = false;
    }

    return [
        () => {
            element.removeEventListener("touchstart", start);
        },
        () => {
            element.removeEventListener("touchmove", move);
        },
        () => {
            element.removeEventListener("touchend", end);
        },
    ];
}
