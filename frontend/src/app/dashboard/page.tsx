"use client";

import React from "react";
import { NewsControls } from "@/components/studio/NewsControls";
import { PhonePreview } from "@/components/studio/PhonePreview";
import { TimelineScrubber } from "@/components/studio/TimelineScrubber";
import { InspectorPanel } from "@/components/studio/InspectorPanel";

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-bg-base">
      {/* 1. Left Controls Column (340px) */}
      <div className="w-full md:w-[340px] shrink-0 h-full overflow-hidden">
        <NewsControls />
      </div>

      {/* 2. Center Canvas Column (Flex-1 Phone Preview + Timeline Scrubber) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden border-r border-border">
        <PhonePreview />
        <TimelineScrubber />
      </div>

      {/* 3. Right Inspector Column (360px) */}
      <div className="w-full md:w-[360px] shrink-0 h-full overflow-hidden">
        <InspectorPanel />
      </div>
    </div>
  );
}
