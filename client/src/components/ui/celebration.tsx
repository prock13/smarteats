import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function CelebrationAnimation() {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{
            scale: [1, 2, 0],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="text-red-500"
        >
          <Heart className="w-16 h-16" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.5, 0],
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="absolute inset-0 bg-red-500/10"
        />
      </div>
    </AnimatePresence>
  );
}

export function FavoriteButton({
  isFavorite,
  onClick,
  disabled,
  className,
}: {
  isFavorite: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded-full transition-colors",
        isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
