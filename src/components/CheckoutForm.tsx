"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  createPixChargeAction,
  chargeCreditCardAction,
} from "@/app/painel/checkout/actions";

declare global {
  interface Window {
    EfiPay?: {
      CreditCard: {
        setCardNumber: (number: string) => { verifyCardBrand: () => Promise<string> };
        setAccount: (accountId: string) => {
          setEnvironment: (env: "production" | "sandbox") => {
            setCreditCardData: (data: {
              brand: string;
              number: string;
              cvv: string;
              expirationMonth: string;
              expirationYear: string;
              holderName: string;
              holderDocument: string;
              reuse: boolean;
            }) => { getPaymentToken: () => Promise<{ payment_token: string; card_mask: string }> };
          };
        };
      };
    };
  }
}

type Props = {
  gnClientId: string;
  efiEnvironment: "production" | "sandbox";
};

type PixState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "ready"; txid: string; pixCopiaECola: string; qrCodeImage: string }
  | { step: "paid" }
  | { step: "error"; message: string };

export function CheckoutForm({ gnClientId, efiEnvironment }: Props) {
  const [tab, setTab] = useState<"pix" | "credit">("pix");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 rounded-full bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setTab("pix")}
          className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${
            tab === "pix" ? "bg-brand text-black" : "text-white/70"
          }`}
        >
          Pix
        </button>
        <button
          type="button"
          onClick={() => setTab("credit")}
          className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${
            tab === "credit" ? "bg-brand text-black" : "text-white/70"
          }`}
        >
          Cartão de crédito
        </button>
      </div>

      {tab === "pix" ? <PixCheckout /> : null}
      {tab === "credit" ? (
        <CreditCardCheckout gnClientId={gnClientId} efiEnvironment={efiEnvironment} />
      ) : null}
    </div>
  );
}

function PixCheckout() {
  const [state, setState] = useState<PixState>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    setState({ step: "loading" });
    startTransition(async () => {
      const result = await createPixChargeAction();
      if (!result.ok) {
        setState({ step: "error", message: result.error });
        return;
      }
      setState({
        step: "ready",
        txid: result.txid,
        pixCopiaECola: result.pixCopiaECola,
        qrCodeImage: result.qrCodeImage,
      });

      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/checkout/status?txid=${result.txid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          setState({ step: "paid" });
          router.refresh();
        }
      }, 4000);
    });
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state.step === "paid") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand/15 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-black">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <p className="text-lg font-bold text-white">Pagamento confirmado!</p>
        <p className="text-sm text-white/60">Sua conta agora é Premium.</p>
      </div>
    );
  }

  if (state.step === "ready") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/5 p-6">
        <Image
          src={state.qrCodeImage}
          alt="QR Code Pix"
          width={220}
          height={220}
          className="rounded-2xl bg-white p-2"
        />
        <p className="text-center text-sm text-white/60">
          Escaneie o QR Code ou copie o código abaixo no seu app do banco.
        </p>
        <button
          type="button"
          onClick={() => handleCopy(state.pixCopiaECola)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-white/20"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar código Pix"}
        </button>
        <p className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 size={14} className="animate-spin" />
          Aguardando confirmação do pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {state.step === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {state.message}
        </p>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
      >
        {isPending ? "Gerando Pix..." : "Gerar Pix"}
      </button>
    </div>
  );
}

function CreditCardCheckout({ gnClientId, efiEnvironment }: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!window.EfiPay) {
      setError("Formulário de cartão ainda carregando, tente novamente em instantes.");
      return;
    }

    const form = e.currentTarget;
    const number = (form.elements.namedItem("number") as HTMLInputElement).value.replace(/\s/g, "");
    const holderName = (form.elements.namedItem("holderName") as HTMLInputElement).value.trim();
    const holderDocument = (form.elements.namedItem("holderDocument") as HTMLInputElement).value.replace(
      /\D/g,
      ""
    );
    const expirationMonth = (form.elements.namedItem("expirationMonth") as HTMLInputElement).value.trim();
    const expirationYear = (form.elements.namedItem("expirationYear") as HTMLInputElement).value.trim();
    const cvv = (form.elements.namedItem("cvv") as HTMLInputElement).value.trim();

    setStatus("loading");
    setError("");

    try {
      const brand = await window.EfiPay.CreditCard.setCardNumber(number).verifyCardBrand();

      const tokenResult = await window.EfiPay.CreditCard.setAccount(gnClientId)
        .setEnvironment(efiEnvironment)
        .setCreditCardData({
          brand,
          number,
          cvv,
          expirationMonth,
          expirationYear,
          holderName,
          holderDocument,
          reuse: false,
        })
        .getPaymentToken();

      const fd = new FormData();
      fd.set("paymentToken", tokenResult.payment_token);
      fd.set("cardName", holderName);
      fd.set("cpf", holderDocument);

      const result = await chargeCreditCardAction(null, fd);

      if (result && "success" in result) {
        setStatus("success");
        router.refresh();
        return;
      }

      setError(result?.error ?? "Não foi possível processar o pagamento.");
      setStatus("error");
    } catch (err) {
      console.error("[checkout/cartão]", err);
      const efiError = err as { error_description?: string; error?: string; code?: number };
      setError(
        efiError?.error_description ??
          efiError?.error ??
          "Não foi possível validar o cartão. Confira os dados e tente novamente."
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand/15 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-black">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <p className="text-lg font-bold text-white">Pagamento aprovado!</p>
        <p className="text-sm text-white/60">Sua conta agora é Premium.</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi-umd.min.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="Número do cartão"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          name="holderName"
          autoComplete="cc-name"
          placeholder="Nome impresso no cartão"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />
        <div className="flex gap-3">
          <input
            name="expirationMonth"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            maxLength={2}
            required
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <input
            name="expirationYear"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            maxLength={4}
            required
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <input
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVV"
            maxLength={4}
            required
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
        <input
          name="holderDocument"
          inputMode="numeric"
          placeholder="CPF do titular"
          required
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
        />

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!scriptReady || status === "loading"}
          className="flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
        >
          {status === "loading" ? "Processando..." : "Pagar com cartão"}
        </button>
      </form>
    </>
  );
}
