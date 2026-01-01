import { useState, useEffect, useRef } from "react";

type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface Job {
  id: string;
  status: JobStatus;
  imageUrl?: string;
  errorMessage?: string;
}

export function useImageJobPoller(initialJobIds: string[]) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize jobs state when IDs change
  useEffect(() => {
    if (initialJobIds.length > 0) {
      setJobs(initialJobIds.map(id => ({ id, status: "PENDING" })));
      setIsPolling(true);
    }
  }, [initialJobIds]);

  useEffect(() => {
    if (!isPolling || initialJobIds.length === 0) return;

    const fetchStatuses = async () => {
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

          // Check if all are done
          const allDone = updatedJobs.every(
            (job) => job.status === "COMPLETED" || job.status === "FAILED"
          );

          if (allDone) {
            setIsPolling(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial fetch
    fetchStatuses();

    // Poll every 3 seconds
    intervalRef.current = setInterval(fetchStatuses, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPolling, initialJobIds]);

  return {
    jobs,
    isPolling,
    completedCount: jobs.filter((j) => j.status === "COMPLETED").length,
    failedCount: jobs.filter((j) => j.status === "FAILED").length,
  };
}
