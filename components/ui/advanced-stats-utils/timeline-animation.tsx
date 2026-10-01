"use client";

// Aparición escalonada al entrar en pantalla (reemplazo del TimelineAnimation de 21st.dev).
import { motion } from "framer-motion";
import type { ReactNode, RefObject } from "react";

export function TimelineAnimation({
  animationNum,
  className,
  children,
}: {
  animationNum: number;
  timelineRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ delay: animationNum * 0.08, duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
