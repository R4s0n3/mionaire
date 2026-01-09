"use client";

import { useState } from "react";
import { HomeIcon, SidebarClose, SidebarOpen } from "lucide-react";
import { stages } from "@/util/stages";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface JokerProps {
  fiftyFiftyUsed: boolean;
  audiencePollUsed: boolean;
  triggerFiftyFifty:
  | ((args: { gameId: string; questionId: number }) => void)
  | undefined;
  triggerAudiencePoll:
  | ((args: { gameId: string; questionId: number }) => void)
  | undefined;
  audiencePollResults: { answer: string; percent: number }[] | null;
  currentQuestionId: number | undefined;
  gameId: string;
}

export default function SideBar({
  currentStage,
  fiftyFiftyUsed,
  audiencePollUsed,
  triggerFiftyFifty,
  triggerAudiencePoll,
  audiencePollResults,
  currentQuestionId,
  gameId,
}: { currentStage: number } & JokerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFiftyFifty = () => {
    if (currentQuestionId && triggerFiftyFifty) {
      triggerFiftyFifty({ gameId, questionId: currentQuestionId });
    }
  };

  const handleAudiencePoll = () => {
    if (currentQuestionId && triggerAudiencePoll) {
      triggerAudiencePoll({ gameId, questionId: currentQuestionId });
    }
  };

  const sidebarVariants = {
    open: {
      width: "100%",
      height: "24rem",
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 25,
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
    closed: {
      width: "100%",
      height: "3rem",
      transition: {
        type: "spring" as const,
        stiffness: 250,
        damping: 30,
      },
    },
    openDesktop: {
      width: "16rem",
      height: "100vh",
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 25,
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
    closedDesktop: {
      width: "3rem",
      height: "100vh",
      transition: {
        type: "spring" as const,
        stiffness: 250,
        damping: 30,
      },
    },
  };

  const stageItemVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
    closed: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.15 },
    },
  };

  const textVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
    closed: {
      opacity: 0,
      x: -5,
      transition: { duration: 0.15 },
    },
  };

  return (
    <>
      <div className="absolute bottom-20 right-2 lg:top-2 lg:right-16 z-50 flex gap-2">
        <button
          type="button"
          onClick={handleFiftyFifty}
          disabled={fiftyFiftyUsed}
          className={`flex size-12 items-center justify-center rounded-full border-2 font-bold ${fiftyFiftyUsed
            ? "border-gray-500 bg-gray-500/30 text-gray-500"
            : "border-highlight-yellow bg-highlight-yellow/20 text-highlight-yellow hover:scale-110"
            }`}
          title="50:50 Joker"
        >
          50:50
        </button>
        <button
          type="button"
          onClick={handleAudiencePoll}
          disabled={audiencePollUsed}
          className={`flex size-12 items-center justify-center rounded-full border-2 font-bold ${audiencePollUsed
            ? "border-gray-500 bg-gray-500/30 text-gray-500"
            : "border-highlight-green bg-highlight-green/20 text-highlight-green hover:scale-110"
            }`}
          title="Audience Poll Joker"
        >
          %
        </button>
      </div>

      {audiencePollResults && (
        <motion.div
          className="border-primary-light bg-primary-dark absolute top-16 right-2 z-50 w-48 rounded-lg border-2 p-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-2 text-center text-sm font-bold">
            Audience Poll
          </div>
          {audiencePollResults.map(({ answer, percent }) => (
            <div key={answer} className="flex items-center gap-2 text-sm">
              <span className="w-4 font-bold">{answer}</span>
              <div className="bg-primary h-3 flex-1 overflow-hidden rounded">
                <div
                  className="bg-highlight-purple/70 h-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-8 text-right">{percent}%</span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div
        className={`border-primary-light bg-primary-dark absolute top-0 right-0 flex max-h-screen w-full scroll-pt-48 flex-col items-start justify-between overflow-hidden border-b-2 lg:h-screen lg:border-b-0 lg:border-l-2`}
        variants={sidebarVariants}
        initial={false}
        animate={
          isOpen
            ? window.innerWidth >= 1024
              ? "openDesktop"
              : "open"
            : window.innerWidth >= 1024
              ? "closedDesktop"
              : "closed"
        }
      >
        <motion.button
          className="p-2"
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {isOpen ? (
            <SidebarOpen className="size-8" />
          ) : (
            <SidebarClose className="size-8" />
          )}
        </motion.button>

        <div className="flex w-full flex-col overflow-y-auto text-xl">
          {stages
            .slice()
            .reverse()
            .map((stage, idx) => (
              <motion.div
                key={`stage-${stages.length - idx}`}
                className={`flex p-2 ${isOpen ? "justify-between" : "justify-center"} ${idx % 2 ? "bg-primary" : "bg-primary-light"} ${stages.length - idx === currentStage && "text-highlight-purple"}`}
                variants={stageItemVariants}
                initial="closed"
                animate="open"
                custom={idx}
              >
                <span className="flex aspect-square items-center justify-center text-center">
                  {stages.length - idx}
                </span>

                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      variants={textVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      ${stage.amount.toLocaleString()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>

        <motion.div
          className="p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href="/">
            <HomeIcon className="size-8" />
          </Link>
        </motion.div>
      </motion.div>
    </>
  );
}
