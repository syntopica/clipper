// Sent by the options page after it puts a failed job back in the queue. The
// page writes IndexedDB itself - it shares the extension's origin - but only
// the worker runs jobs, and nothing else would wake it for this one.
export interface ResumeQueuePayload {
  type: 'resume-queue'
}
