"use client";

import { useState } from "react";
import { HomeIcon, SidebarClose, SidebarOpen } from "lucide-react";
import { stages } from "@/util/stages";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SideBar({ currentStage }: { currentStage: number }) {
  const [isOpen, setIsOpen] = useState(false);

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
    <motion.div
      className={`border-primary-light bg-primary-dark absolute top-0 right-0 flex max-h-screen w-full scroll-pt-44 flex-col items-start justify-between overflow-hidden border-b-2 lg:h-screen lg:border-b-0 lg:border-l-2`}
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
  );
}
