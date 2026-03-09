"use client";

import { useState } from "react";
import type { Report } from "@/types/report";

type AddReportFormProps = {
  action: (formData: FormData) => Promise<{ reports: Report[] }>;
  onSuccess: (reports: Report[]) => void;
};

export default function AddReportForm({ action, onSuccess }: AddReportFormProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await action(formData);
      if (result?.reports) {
        onSuccess(result.reports);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="Report title" required disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
