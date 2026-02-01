"use client";

import { Typography } from "@/components/ui/Typography";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-black z-20 p-8">
      <Typography variant="caption" className="text-center">
        © {year} FlowForge. All rights reserved.
      </Typography>
    </footer>
  );
}