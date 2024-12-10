import { is } from "immutable";

export function swipe(
    element: HTMLElement,
    speed = 300,
    swipeHeight: number,
    scrollingElement: HTMLElement
) {
    let startY: number,
        startTime: number,
        isCanMove = false,
        // isScrolling = false,
        deltaY = 0,
        currentY = 0;

    element.addEventListener("touchstart", start);
    document.addEventListener("touchmove", move);
    document.addEventListener("touchend", end);
    scrollingElement.addEventListener("scroll", scrolling);

    function scrolling() {
        isCanMove = false;
        console.log(isCanMove);
        // console.log("scrolling", isScrolling);
        // element.style.transition = "none";
        // document.body.style.overflow = "hidden";
    }

    function start(e: TouchEvent) {
        console.log("startY", e.touches[0].clientY);
        startY = e.touches[0].clientY;
        startTime = Date.now();
        element.style.transition = "none";
        document.body.style.overflow = "hidden";
        isCanMove = true;
        console.log("swipeHeight", swipeHeight, "startY", startY);
    }

    function move(e: TouchEvent) {
        console.log(isCanMove, "moving");
        if (!isCanMove) return;

        deltaY = e.touches[0].clientY - startY;
        if (
            deltaY < 0 &&
            element.style.transform === `translateY(${-swipeHeight}px)`
        ) {
            return;
        }
        if (deltaY > 0 && element.style.transform === `translateY(${0}px)`) {
            return;
        }
        element.style.transform = `translateY(${currentY + deltaY}px)`;
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
        () => {
            scrollingElement.removeEventListener("scroll", scrolling);
        },
    ];
}
