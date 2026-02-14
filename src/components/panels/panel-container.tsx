"use client";

import { useState, useCallback, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

interface PanelContainerProps {
  inputPanel: React.ReactNode;
  archivePanel: React.ReactNode;
  discoverPanel: React.ReactNode;
}

const PANEL_COUNT = 3;
const PANEL_LABELS = ["Input", "Archive", "Discover"];

export function PanelContainer({ inputPanel, archivePanel, discoverPanel }: PanelContainerProps) {
  const [activePanel, setActivePanel] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [deltaX, setDeltaX] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goTo = useCallback((panel: number) => {
    setSwiping(false);
    setDeltaX(0);
    setActivePanel(Math.max(0, Math.min(panel, PANEL_COUNT - 1)));
  }, []);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (isDesktop) return;
      setSwiping(true);
      setDeltaX(e.deltaX);
    },
    onSwipedLeft: () => {
      if (!isDesktop) goTo(activePanel + 1);
    },
    onSwipedRight: () => {
      if (!isDesktop) goTo(activePanel - 1);
    },
    onTouchEndOrOnMouseUp: () => {
      setSwiping(false);
      setDeltaX(0);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Desktop: side by side (input + discover, archive accessible via nav)
  if (isDesktop) {
    return (
      <div className="h-dvh grid grid-cols-2 divide-x">
        <div className="overflow-hidden">{inputPanel}</div>
        <div className="overflow-hidden">{discoverPanel}</div>
      </div>
    );
  }

  // Mobile: swipeable 3 panels
  const translateX = swiping
    ? -activePanel * 100 + (deltaX / (typeof window !== "undefined" ? window.innerWidth : 1)) * 100
    : -activePanel * 100;

  return (
    <div className="h-dvh overflow-hidden" {...handlers}>
      {/* Panel indicator dots */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {Array.from({ length: PANEL_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={PANEL_LABELS[i]}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              activePanel === i ? "bg-primary w-4" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      <div
        className="flex h-full"
        style={{
          transform: `translateX(${translateX}%)`,
          transition: swiping ? "none" : "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          width: `${PANEL_COUNT * 100}%`,
        }}
      >
        <div style={{ width: `${100 / PANEL_COUNT}%` }} className="h-full overflow-hidden">{inputPanel}</div>
        <div style={{ width: `${100 / PANEL_COUNT}%` }} className="h-full overflow-hidden">{archivePanel}</div>
        <div style={{ width: `${100 / PANEL_COUNT}%` }} className="h-full overflow-hidden">{discoverPanel}</div>
      </div>
    </div>
  );
}
