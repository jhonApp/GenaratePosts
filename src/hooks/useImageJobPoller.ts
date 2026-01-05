import { useState, useEffect, useRef } from "react";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  status: JobStatus;
  imageUrl?: string;
  errorMessage?: string;
}

export function useImageJobPoller(initialJobIds: string[]) {
  const [jobs, setJobs] = useState<Job[]>(() => 
    initialJobIds.map((id) => ({ id, status: "PENDING" }))
  );
  const [isPolling, setIsPolling] = useState(() => initialJobIds.length > 0);
  
  // Track previous IDs to handle updates from props
  const [prevInitialJobIds, setPrevInitialJobIds] = useState(initialJobIds);
  const shouldPollRef = useRef(initialJobIds.length > 0);

  // Sync ref with state
  useEffect(() => {
    shouldPollRef.current = isPolling;
  }, [isPolling]);

  // Adjust state during render if props change
  if (initialJobIds !== prevInitialJobIds) {
    setPrevInitialJobIds(initialJobIds);
    setJobs(initialJobIds.map((id) => ({ id, status: "PENDING" })));
    const shouldPoll = initialJobIds.length > 0;
    setIsPolling(shouldPoll);
  }

  useEffect(() => {
    if (initialJobIds.length === 0 || !isPolling) return;

    let timeoutId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/queue/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds: initialJobIds }),
        });

        if (res.ok) {
          const data = await res.json();
          const updatedJobs: Job[] = data.jobs;

          setJobs(updatedJobs);

          // Check if all finished
          const allFinished = updatedJobs.every(
            (job) => job.status === "COMPLETED" || job.status === "FAILED"
          );

          if (allFinished) {
            shouldPollRef.current = false;
            setIsPolling(false);
            return; // Stop polling
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      // Schedule next poll if still needed
      if (shouldPollRef.current) {
        timeoutId = setTimeout(fetchStatus, 2000); // 2 second interval
      }
    };

    fetchStatus();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialJobIds, isPolling]);

  return {
    jobs,
    isPolling,
  };
}
