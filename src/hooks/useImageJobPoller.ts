import { useState, useEffect, useRef } from "react";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  status: JobStatus;
  imageUrl?: string;
  errorMessage?: string;
}

export function useImageJobPoller(initialJobIds: string[]) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  
  // Use a ref to track if we should continue polling
  const shouldPollRef = useRef(false);

  // Initialize state when initialJobIds change
  useEffect(() => {
    if (initialJobIds.length > 0) {
      setJobs(initialJobIds.map((id) => ({ id, status: "PENDING" })));
      setIsPolling(true);
      shouldPollRef.current = true;
    } else {
        setIsPolling(false);
        shouldPollRef.current = false;
    }
  }, [initialJobIds]);

  useEffect(() => {
    if (!shouldPollRef.current || initialJobIds.length === 0) return;

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

          setJobs((prevJobs) => {
            // Merge previous state (to keep order if needed, though mostly replacing)
             return updatedJobs; 
          });

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
  }, [initialJobIds]);

  return {
    jobs,
    isPolling,
  };
}
