"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReunionMode } from "@/hooks/use-reunion-mode";
import { ReunionHeader } from "@/components/reunion/reunion-header";
import { ReunionNavigation } from "@/components/reunion/reunion-navigation";
import { ReunionSidebar } from "@/components/reunion/reunion-sidebar";
import { ReunionTestimonyView } from "@/components/reunion/reunion-testimony";
import type { Service, ReunionTestimony } from "@/lib/types";

interface ReunionViewProps {
  planId: string;
  serviceId: string;
  service: Service;
  initialTestimonies: ReunionTestimony[];
  backUrl: string;
}

export function ReunionView({
  planId,
  serviceId,
  service,
  initialTestimonies,
  backUrl,
}: ReunionViewProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const reunion = useReunionMode({
    planId,
    serviceId,
    initialTestimonies,
  });

  // Auto-start reunion mode when the view mounts
  useEffect(() => {
    reunion.startReunion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = useCallback(() => {
    reunion.endReunion();
    router.push(backUrl);
  }, [reunion, router, backUrl]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const currentTestimony = reunion.testimonies[reunion.currentIndex];

  if (!currentTestimony) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          reunion.isDarkMode ? "bg-reunion-bg text-reunion-fg" : "bg-[#FAFAFA]"
        }`}
      >
        <p className="text-lg">Aucun témoignage dans ce planning.</p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col ${
        reunion.isDarkMode ? "bg-reunion-bg" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Header */}
      <ReunionHeader
        service={service}
        isDarkMode={reunion.isDarkMode}
        onToggleDarkMode={reunion.toggleDarkMode}
        onBack={handleBack}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Main content area */}
      <main className="flex-1 px-5 py-6 pb-40">
        <ReunionTestimonyView
          testimony={currentTestimony}
          isDarkMode={reunion.isDarkMode}
        />
      </main>

      {/* Fixed bottom navigation */}
      <ReunionNavigation
        currentIndex={reunion.currentIndex}
        total={reunion.total}
        testimonies={reunion.testimonies}
        isDarkMode={reunion.isDarkMode}
        isFirst={reunion.isFirst}
        isLast={reunion.isLast}
        onNext={reunion.goToNext}
        onPrevious={reunion.goToPrevious}
        onSkip={reunion.skipCurrent}
      />

      {/* Sidebar (Sheet) */}
      <ReunionSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        testimonies={reunion.testimonies}
        currentIndex={reunion.currentIndex}
        isDarkMode={reunion.isDarkMode}
        onJumpTo={reunion.jumpTo}
        readCount={reunion.readCount}
        total={reunion.total}
      />
    </div>
  );
}
