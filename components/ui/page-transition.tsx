'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import React from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.2,
                ease: "easeOut"
            }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    )
}
