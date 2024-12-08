export function swipe(element: HTMLElement, speed = 300, swipeHeight: number) {
    let startY: number,
        startTime: number,
        deltaY = 0,
        isFastSwipe = false,
        currentY = 0;

    element.addEventListener("touchstart", start);
    document.addEventListener("touchmove", move);
    document.addEventListener("touchend", end);

    function start(e: TouchEvent) {
        startY = e.touches[0].clientY;
        startTime = Date.now();
        isFastSwipe = false;
        element.style.transition = "none";
        document.body.style.overflow = "hidden";

        console.log("swipeHeight", swipeHeight, "startY", startY);
    }

    function move(e: TouchEvent) {
        console.log(e.touches[0].clientY);
        deltaY = e.touches[0].clientY - startY;
        element.style.transform = `translateY(${currentY + deltaY}px)`;
        // element.style.top = `${element.style.top + deltaY}px`;
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
