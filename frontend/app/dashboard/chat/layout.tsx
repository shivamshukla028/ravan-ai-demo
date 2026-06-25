import type { ReactNode } from "react";

/**
 * Override the default dashboard layout for the chat page.
 * The chat module needs full height with NO extra padding — it manages its own layout.
 */
export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex overflow-hidden h-full -m-8">
      {children}
    </div>
  );
}
