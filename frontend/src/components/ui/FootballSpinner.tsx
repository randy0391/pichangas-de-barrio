import { motion } from 'motion/react';

export const FootballSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-5xl"
      >
        ⚽
      </motion.div>
      <p className="text-slate-500 font-medium mt-4">Cargando la jugada...</p>
    </div>
  );
};
