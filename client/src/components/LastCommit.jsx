import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LastCommit = ({ mourningData, onClose }) => {
    if (!mourningData) return null;

    const { deceasedName, lastCommit, quote } = mourningData;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center text-white p-8 overflow-hidden"
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.05)_0%,transparent_70%)]" />

            {/* The Candle */}
            <div className="relative mb-12">
                <svg width="60" height="120" viewBox="0 0 60 120" className="filter drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]">
                    {/* Flame */}
                    <motion.path
                        d="M30 40C30 40 15 60 15 75C15 85 22 92 30 92C38 92 45 85 45 75C45 60 30 40 30 40Z"
                        fill="url(#flameGradient)"
                        animate={{
                            scaleY: [1, 1.1, 0.9, 1.05, 1],
                            scaleX: [1, 0.95, 1.05, 0.98, 1],
                            translateX: [0, -1, 1, -0.5, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    {/* Wick */}
                    <rect x="29" y="85" width="2" height="10" fill="#333" />
                    {/* Base */}
                    <rect x="20" y="95" width="20" height="5" rx="1" fill="#222" />

                    <defs>
                        <radialGradient id="flameGradient">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="30%" stopColor="#ffea00" />
                            <stop offset="60%" stopColor="#ff8c00" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>

            {/* The Reveal */}
            <div className="max-w-3xl w-full text-center space-y-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 2 }}
                    className="text-orange-200/60 font-mono text-sm tracking-widest uppercase mb-4"
                >
                    We found a ghost in the machine.
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4, duration: 3 }}
                    className="space-y-4"
                >
                    <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white/90">
                        {deceasedName}
                    </h1>
                    <p className="text-white/40 font-mono text-lg italic">
                        Final Act of Creation: {new Date(lastCommit.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 7, duration: 2 }}
                    className="bg-white/[0.03] border border-white/10 p-8 rounded-lg backdrop-blur-sm text-left font-mono group"
                >
                    <div className="text-white/30 text-xs mb-4 flex justify-between">
                        <span>COMMIT {lastCommit.sha}</span>
                        <span>LAST_FRAGMENT</span>
                    </div>
                    <div className="text-xl md:text-2xl text-orange-100/80 leading-relaxed">
                        {lastCommit.message}
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-white/20 text-sm">
                        <div className="h-[1px] flex-1 bg-white/10" />
                        <span>EXISTS IN PERPETUITY</span>
                        <div className="h-[1px] flex-1 bg-white/10" />
                    </div>
                </motion.div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 10, duration: 2 }}
                    className="pt-12"
                >
                    <p className="text-2xl font-light tracking-wide text-white/60 italic">
                        "{quote}"
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05, color: '#fff' }}
                        onClick={onClose}
                        className="mt-12 px-6 py-2 border border-white/10 rounded-full text-white/30 text-sm tracking-widest uppercase hover:bg-white/5 transition-all"
                    >
                        Return to the Living
                    </motion.button>

                </motion.footer>
            </div>

            {/* Floating Particles (Dust in a sunbeam style) */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-200/20 rounded-full pointer-events-none"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        opacity: [0, 0.5, 0],
                        scale: [0, 1.5, 0]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 20,
                        repeat: Infinity,
                        delay: Math.random() * 10
                    }}
                />
            ))}
        </motion.div>
    );
};

export default LastCommit;
