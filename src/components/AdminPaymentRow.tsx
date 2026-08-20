"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { updatePaymentStatusAction, deletePaymentAction } from "@/app/admin/(dashboard)/pagamentos/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  refunded: "Reembolsado",
  failed: "Falhou",
};

export function AdminPaymentRow({
  paymentId,
  initialStatus,
}: {
  paymentId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setError("");
    const fd = new FormData();
    fd.set("status", newStatus);
    startTransition(async () => {
      const result = await updatePaymentStatusAction(paymentId, null, fd);
      if (result && "error" in result) {
        setError(result.error);
        setStatus(initialStatus);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm("Excluir este registro de pagamento?")) return;
    startTransition(async () => {
      await deletePaymentAction(paymentId);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none disabled:opacity-60"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Excluir pagamento"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition active:scale-90 hover:bg-red-500/25 disabled:opacity-60"
      >
        <Trash2 size={13} strokeWidth={1.75} />
      </button>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
