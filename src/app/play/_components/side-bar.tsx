"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListOrdered, X } from "lucide-react";

import { stages } from "@/util/stages";

function PrizeLadder({ currentStage }: { currentStage: number }) {
  const activeRowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const activeRow = activeRowRef.current;
    const scrollArea = activeRow?.parentElement?.parentElement;

    if (activeRow && scrollArea) {
      scrollArea.scrollTop =
        activeRow.offsetTop -
        scrollArea.clientHeight / 2 +
        activeRow.clientHeight / 2;
    }
  }, [currentStage]);

  return (
    <ol className="flex flex-col gap-1" aria-label="Prize ladder">
      {stages
        .map((stage, index) => ({ ...stage, number: index + 1 }))
        .reverse()
        .map((stage) => {
          const active = stage.number === currentStage;
          const complete = stage.number < currentStage;
          const milestone = [5, 10, 15].includes(stage.number);

          return (
            <li
              key={stage.number}
              ref={active ? activeRowRef : undefined}
              className="prize-row"
              data-active={active}
              data-complete={complete}
              data-milestone={milestone}
              aria-current={active ? "step" : undefined}
            >
              <span className="text-right text-[0.68rem] opacity-70">
                {active ? ">" : stage.number}
              </span>
              <span>${stage.amount.toLocaleString()}</span>
            </li>
          );
        })}
    </ol>
  );
}

export default function SideBar({ currentStage }: { currentStage: number }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="icon-button fixed top-4 right-4 z-30 xl:hidden"
        aria-label="Open prize ladder"
        aria-expanded={isOpen}
      >
        <ListOrdered className="size-5" aria-hidden="true" />
      </button>

      <aside className="glass-panel hidden h-fit max-h-[calc(100svh-7rem)] flex-col overflow-hidden xl:flex">
        <div className="flex items-center justify-between border-b-2 border-dashed border-white/15 px-4 py-3">
          <h2 className="text-secondary font-mono text-xs font-black uppercase">
            $ ladder
          </h2>
          <span className="font-mono text-[0.65rem] text-white/45">
            Q.{currentStage}
          </span>
        </div>
        <div className="overflow-y-auto p-2">
          <PrizeLadder currentStage={currentStage} />
        </div>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/70 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.aside
              className="glass-panel max-h-[84svh] w-full overflow-hidden border-b-0"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-ladder-title"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-white/15 p-4">
                <div>
                  <p className="eyebrow">MIONAIRE</p>
                  <h2
                    id="mobile-ladder-title"
                    className="mt-1 font-mono text-sm font-black text-white uppercase"
                  >
                    $ ladder / q.{currentStage}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="icon-button"
                  aria-label="Close prize ladder"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <div className="max-h-[calc(84svh-6rem)] overflow-y-auto p-4">
                <PrizeLadder currentStage={currentStage} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
