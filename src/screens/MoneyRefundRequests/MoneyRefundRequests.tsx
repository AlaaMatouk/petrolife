import React, { useState } from "react";
import { RequestFormSection } from "./sections/RequestFormSection/RequestFormSection";
import { RequestHistorySection } from "./sections/RequestHistorySection/RequestHistorySection";

export const MoneyRefundRequests = (): JSX.Element => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSubmit = () => {
    // Trigger refresh of history section
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <RequestFormSection onFormSubmit={handleFormSubmit} />
      <RequestHistorySection refreshTrigger={refreshTrigger} />
    </>
  );
};
