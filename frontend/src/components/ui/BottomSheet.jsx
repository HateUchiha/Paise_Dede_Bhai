import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Sheet / Modal */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // Apple velocity handoff & projection
              if (info.offset.y > 100 || info.velocity.y > 400) {
                onClose();
              }
            }}
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 320,
            }}
            className={`w-full ${maxWidth} bg-[#16171d]/90 backdrop-blur-2xl border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 pt-3 relative shadow-2xl z-10 max-h-[85vh] overflow-y-auto`}
          >
            {/* Grab indicator handle (direct manipulation affordance) */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing hover:bg-white/30 transition-colors" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors apple-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
