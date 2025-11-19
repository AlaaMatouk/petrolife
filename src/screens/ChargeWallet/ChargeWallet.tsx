import { AutomaticChargeSection } from "./sections/AutomaticChargeSection/AutomaticChargeSection";
import { ManualChargeSection } from "./sections/ManualChargeSection/ManualChargeSection";
import { useState } from "react";

export const ChargeWallet = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('manual');

  return (
    <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
      {activeTab === 'automatic' ? (
        <AutomaticChargeSection onTabChange={setActiveTab} />
      ) : (
        <ManualChargeSection onTabChange={setActiveTab} />
      )}
    </div>
  );
};
