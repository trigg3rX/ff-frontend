"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  LuArrowLeft,
  LuArrowRight,
  LuPlay,
  LuSquareArrowOutUpRight,
} from "react-icons/lu";

type MadeEasySectionProps = {
  heightClass?: string;
  progressExternal?: MotionValue<number>;
};

export function MadeEasySection({
  heightClass = "h-[600vh]",
  progressExternal,
}: MadeEasySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gifKey, setGifKey] = useState(0);

  // Restart GIFs on a timer so they play fully (step2+ are longer; 8s allows full playback)
  useEffect(() => {
    const interval = setInterval(() => setGifKey((k) => k + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Prefer external timeline when provided, otherwise fall back to local scroll.
  const progress = progressExternal ?? scrollYProgress;

  // 1. COMPLEX
  const complexX = useTransform(
    progress,
    [0, 0.1, 0.15, 0.4],
    ["0%", "0%", "-28vw", "-32vw"]
  );
  const complexY = useTransform(
    progress,
    [0, 0.1, 0.15, 0.4],
    ["-10.5vh", "-20vh", "-20vh", "-40vh"]
  );

  // 2. MADE
  const madeX = useTransform(
    progress,
    [0, 0.1, 0.15, 0.4],
    ["0%", "0%", "28vw", "32vw"]
  );
  const madeY = useTransform(
    progress,
    [0, 0.1, 0.15, 0.4],
    ["0vh", "0vh", "-20vh", "-40vh"]
  );

  // 3. COMPELLING
  const compellingY = useTransform(
    progress,
    [0, 0.1, 0.15, 0.4],
    ["10.5vh", "20vh", "20vh", "40vh"]
  );

  // --- TEXT SCALING ---
  // Large in center stack (1), shrinks slightly when moving to corners (0.6)
  const textScale = useTransform(progress, [0.1, 0.15], [1, 0.6]);

  // --- ICON SWAPPING ---
  // 1. Initial Lockup Icons (Play, Square, etc): Visible at start, fade out as they move to corners
  const initialIconsOpacity = useTransform(progress, [0.1, 0.15], [1, 0]);

  // 2. Final Layout Icons (Arrows at bottom): Invisible at start, fade in at end
  const finalIconsOpacity = useTransform(progress, [0.15, 0.35], [0, 1]);

  // --- ORANGE CARD ANIMATIONS ---
  // Starts after the text has cleared the center area (around 0.3)
  const cardOpacity = useTransform(progress, [0.2, 0.25], [0, 1]);
  const cardHeight = useTransform(progress, [0.15, 0.4], ["60px", "500px"]);
  const cardWidth = useTransform(progress, [0.15, 0.3], ["55vw", "55vw"]);

  const cardX = useTransform(progress, [0.55, 0.65], ["0vw", "-36vw"]);
  const cardY = useTransform(progress, [0.55, 0.65], ["0vh", "-10vh"]);
  const cardScale = useTransform(progress, [0.55, 0.65], [1, 0.35]);

  const imageScale = useTransform(progress, [0.2, 0.4], [1.5, 1]);

  // --- NEW: RIGHT SIDE IMAGES ANIMATION ---
  const sideImagesOpacity = useTransform(progress, [0.4, 0.45], [0, 1]);

  const sideImage1Height = useTransform(
    progress,
    [0.45, 0.5],
    ["0px", "170px"]
  );
  const sideImage1X = useTransform(
    progress,
    [0.55, 0.65, 0.67, 0.75],
    ["0vw", "-36vw", "-36vw", "-72vw"]
  );
  const sideImage1Scale = useTransform(
    progress,
    [0.55, 0.65, 0.67, 0.75],
    [1, 2.85, 2.85, 0.9]
  );
  const sideImage1ZIndex = useTransform(
    progress,
    [0.55, 0.65, 0.67, 0.75, 0.85, 0.95],
    [0, 40, 40, 0, 0, 0]
  );
  const sideImage1Y = useTransform(
    progress,
    [0.55, 0.65, 0.67, 0.75],
    ["0vh", "10vh", "10vh", "25vh"]
  );

  const sideImage2Height = useTransform(
    progress,
    [0.45, 0.5],
    ["0px", "130px"]
  );
  const sideImage2X = useTransform(
    progress,
    [0.67, 0.75, 0.78, 0.85],
    ["0vw", "-38vw", "-38vw", "-76vw"]
  );
  const sideImage2Scale = useTransform(
    progress,
    [0.67, 0.75, 0.78, 0.85],
    [1, 3.7, 3.7, 1.4]
  );
  const sideImage2ZIndex = useTransform(
    progress,
    [0.67, 0.75, 0.78, 0.85],
    [0, 40, 40, 0]
  );
  const sideImage2Y = useTransform(
    progress,
    [0.67, 0.75, 0.78, 0.85],
    ["0vh", "-11vh", "-11vh", "-20.7vh"]
  );

  const sideImage3Opacity = useTransform(progress, [0.5, 0.55], [0, 1]);
  const sideImage3Height = useTransform(
    progress,
    [0.55, 0.6],
    ["0px", "170px"]
  );
  const sideImage3X = useTransform(
    progress,
    [0.78, 0.85, 0.87, 0.95],
    ["0vw", "-35vw", "-35vw", "-72vw"]
  );
  const sideImage3Scale = useTransform(
    progress,
    [0.78, 0.85, 0.87, 0.95],
    [1, 2.85, 2.85, 0.9]
  );
  const sideImage3ZIndex = useTransform(
    progress,
    [0.78, 0.85, 0.87, 0.95],
    [0, 40, 40, 50]
  );
  const sideImage3Y = useTransform(
    progress,
    [0.78, 0.85, 0.87, 0.95],
    ["0vh", "10vh", "10vh", "26vh"]
  );

  const sideImage4Height = useTransform(
    progress,
    [0.65, 0.7],
    ["0px", "170px"]
  );
  const sideImage4X = useTransform(progress, [0.87, 0.95], ["0vw", "-36vw"]);
  const sideImage4Scale = useTransform(progress, [0.85, 0.9], [1, 2.85]);
  const sideImage4ZIndex = useTransform(progress, [0.85, 0.9], [0, 50]);
  const sideImage4Y = useTransform(progress, [0.85, 0.9], ["0vh", "-13vh"]);

  // Shift everything left once the sequence ends to open right-side space
  const finalLeftShiftX = useTransform(progress, [0.95, 1], ["0vw", "-1vw"]);

  return (
    <section
      ref={containerRef}
      className={`relative ${heightClass} bg-black z-10`}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-0 top-0 h-screen w-full flex items-center justify-center"
          style={{ x: finalLeftShiftX }}
        >
          {/* --- 1. COMPLEX ROW --- */}
          <motion.div
            className="absolute flex items-center z-30 whitespace-nowrap origin-center"
            style={{ x: complexX, y: complexY, scale: textScale }}
          >
            <span className="text-white text-5xl md:text-8xl font-bold tracking-tighter flex items-center">
              COMPLEX
            </span>
            {/* Initial Icon: Play Triangle */}
            <motion.div
              style={{ opacity: initialIconsOpacity }}
              className="ml-4 flex items-center"
            >
              <LuPlay className="fill-white text-white w-6 h-6 md:w-10 md:h-10" />
            </motion.div>
          </motion.div>

          {/* --- 2. MADE ROW --- */}
          <motion.div
            className="absolute flex items-center z-30 whitespace-nowrap origin-center"
            style={{ x: madeX, y: madeY, scale: textScale }}
          >
            {/* Initial Icon: Solid Rectangle */}
            <motion.div
              style={{ opacity: initialIconsOpacity }}
              className="bg-white w-8 h-5 md:w-14 md:h-8 mr-4"
            />

            <span className="text-white text-5xl md:text-8xl font-bold tracking-tighter mr-2">
              MADE
            </span>

            {/* Initial Icon: Square Arrow */}
            <motion.div
              style={{ opacity: initialIconsOpacity }}
              className="mb-2 ml-2"
            >
              <LuSquareArrowOutUpRight className="text-white stroke-[3px] w-6 h-6 md:w-10 md:h-10 rotate-90" />
            </motion.div>
          </motion.div>

          {/* --- 3. CENTER CARD (THE REVEAL) --- */}
          <motion.div
            className="absolute z-20 overflow-hidden flex flex-col justify-end rounded-4xl bg-[#050505] border border-white/10"
            style={{
              x: cardX,
              y: cardY,
              scale: cardScale,
              opacity: cardOpacity,
              height: cardHeight,
              width: cardWidth,
            }}
          >
            <motion.div className="absolute inset-0 w-full h-full" style={{ scale: imageScale }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={gifKey}
                src={`/step1.gif?t=${gifKey}`}
                alt="Hybrid Canvas"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            </motion.div>
            <div className="relative z-10 p-8 md:p-12 space-y-4 bg-linear-to-t from-black via-black/60 to-transparent">
              <h3 className="text-white text-[35px] font-bold leading-none mb-2">
                Add Blocks
              </h3>
              <p className="text-gray-300 text-[17px] leading-tight">
                Drag and drop or click on blocks to add to canvas and start creating workflow.
              </p>
            </div>
          </motion.div>

          {/* --- 4. RIGHT SIDE IMAGES (Expanding from Center) --- */}
          <motion.div
            className="absolute right-[3vw] top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20"
            style={{ opacity: sideImagesOpacity }}
          >
            {/* Image Wrappers (Using your logic) */}
            <div className="w-[18vw] h-42.5 flex items-center justify-center">
              <motion.div
                style={{
                  height: sideImage1Height,
                  x: sideImage1X,
                  y: sideImage1Y,
                  scale: sideImage1Scale,
                  zIndex: sideImage1ZIndex,
                }}
                className="w-full relative rounded-lg overflow-hidden bg-[#050505] border-[0.5px] border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={gifKey}
                  src={`/step2.gif?t=${gifKey}`}
                  alt="Seamless Access"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white text-[10px] font-bold leading-none mb-1">Connect Blocks</h3>
                  <p className="text-gray-300 text-[6px] leading-tight">
                    Connect blocks according to your workflow logic to create workflows in canvas.
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="h-32.5 w-[14vw] ml-[4vw] flex items-center justify-center">
              <motion.div
                style={{
                  height: sideImage2Height,
                  x: sideImage2X,
                  y: sideImage2Y,
                  scale: sideImage2Scale,
                  zIndex: sideImage2ZIndex,
                }}
                className="w-full relative rounded-lg overflow-hidden bg-[#050505] border-[0.5px] border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={gifKey}
                  src={`/step3.gif?t=${gifKey}`}
                  alt="Frictionless Run"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white text-[10px] font-bold leading-none mb-1">Configure Blocks</h3>
                  <p className="text-gray-300 text-[5px] leading-tight">
                    Configure blocks to perform actions on your behalf in workflow execution.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* --- 5. SIDE IMAGE AFTER FIRST MOVE (Expanding from Center) --- */}
          <motion.div
            className="absolute right-[3vw] top-1/2 -translate-y-1/2 flex flex-col gap-10"
            style={{ opacity: sideImage3Opacity }}
          >
            <div className="w-[18vw] h-42.5 flex items-center justify-center">
              <motion.div
                style={{
                  height: sideImage3Height,
                  x: sideImage3X,
                  y: sideImage3Y,
                  scale: sideImage3Scale,
                  zIndex: sideImage3ZIndex,
                }}
                className="w-full relative rounded-lg overflow-hidden bg-black border-[0.5px] border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={gifKey}
                  src={`/step4.gif?t=${gifKey}`}
                  alt="Smart Logic"
                  className="absolute inset-0 w-full h-full object-contain opacity-90"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white text-[10px] font-bold leading-none mb-1">Save & Test</h3>
                  <p className="text-gray-300 text-[6px] leading-tight">
                    Save and test your workflows in a secure environment.
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="h-32.5 w-[14vw] ml-[4vw] flex items-center justify-center">
              <motion.div
                style={{
                  height: sideImage4Height,
                  x: sideImage4X,
                  y: sideImage4Y,
                  scale: sideImage4Scale,
                  zIndex: sideImage4ZIndex,
                }}
                className="w-full relative rounded-lg overflow-hidden bg-[#050505] border-[0.5px] border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={gifKey}
                  src={`/step4.gif?t=${gifKey}`}
                  alt="Any Trigger"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white text-[10px] font-bold leading-none mb-1">Deploy or Run</h3>
                  <p className="text-gray-300 text-[5px] leading-tight">
                    Deploy workflows to run on-chain or off-chain actions.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* --- 4. COMPELLING ROW --- */}
          <motion.div
            className="absolute flex items-center justify-center z-30 whitespace-nowrap w-full"
            style={{ y: compellingY }}
          >
            {/* Final Icon: Left Arrow (Fades IN) */}
            <motion.div style={{ opacity: finalIconsOpacity }} className="mr-8">
              <LuArrowRight className="text-white w-8 h-8 md:w-12 md:h-12" />
            </motion.div>

            <motion.span
              style={{ scale: textScale }}
              className="text-white text-5xl md:text-8xl font-bold tracking-tighter"
            >
              COMPELLING
            </motion.span>

            {/* Final Icon: Right Arrow (Fades IN) */}
            <motion.div style={{ opacity: finalIconsOpacity }} className="ml-8">
              <LuArrowLeft className="text-white w-8 h-8 md:w-12 md:h-12" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
