"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Script from "next/script";
import { Check, Copy, Loader2, X } from "lucide-react";
import {
  identifySupporterAction,
  loginWithGoogleAction,
  createSupporterPixChargeAction,
  chargeSupporterCreditCardAction,
  type IdentifyState,
} from "@/app/presidenciaveis/actions";
import { PRESIDENCIAVEIS_PRICE_CENTS } from "@/lib/presidenciaveis-constants";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: { theme: string; width: number }) => void;
        };
      };
    };
  }
}

// Não redeclara `Window.EfiPay` global aqui — CheckoutForm.tsx já faz isso e
// os dois precisariam ter exatamente o mesmo shape. Tipo local + cast em vez
// disso, pra manter os dois arquivos independentes.
type EfiPayGlobal = {
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
        }) => { getPaymentToken: () => Promise<{ payment_token: string }> };
      };
    };
  };
};

function getEfiPay(): EfiPayGlobal | undefined {
  return (window as unknown as { EfiPay?: EfiPayGlobal }).EfiPay;
}

type Step = "identify" | "pay";
type PayTab = "pix" | "credit";
type PixState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "ready"; txid: string; pixCopiaECola: string; qrCodeImage: string }
  | { step: "error"; message: string };

export function SupporterUnlockModal({
  gnClientId,
  googleClientId,
  onUnlocked,
  onClose,
}: {
  gnClientId: string;
  googleClientId: string;
  onUnlocked: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("identify");
  const [payTab, setPayTab] = useState<PayTab>("pix");
  const [identifyError, setIdentifyError] = useState("");
  const [isPending, startTransition] = useTransition();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleIdentifyResult = (result: IdentifyState) => {
    if (!result) return;
    if ("error" in result) {
      setIdentifyError(result.error);
      return;
    }
    if (result.unlocked) {
      onUnlocked();
      return;
    }
    setStep("pay");
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIdentifyError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await identifySupporterAction(null, fd);
      handleIdentifyResult(result);
    });
  };

  const handleGoogleReady = () => {
    if (!window.google || !googleButtonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        setIdentifyError("");
        startTransition(async () => {
          const result = await loginWithGoogleAction(response.credential);
          handleIdentifyResult(result);
        });
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "filled_black",
      width: 280,
    });
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:py-4">
          <div className="w-10" />
          <h2 className="font-heading text-lg font-normal tracking-wide text-white">
            Desbloquear
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {step === "identify" ? (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-white/60">
                Identifique-se pra gerar sua foto de apoio. Por R${" "}
                {(PRESIDENCIAVEIS_PRICE_CENTS / 100).toFixed(2).replace(".", ",")}
                , você desbloqueia gerar/baixar/compartilhar fotos com qualquer
                candidato, pra sempre.
              </p>

              <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={handleGoogleReady}
              />
              <div ref={googleButtonRef} className="flex justify-center" />

              <div className="flex items-center gap-3 text-xs text-white/40">
                <div className="h-px flex-1 bg-white/10" />
                ou
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
                />
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  required
                  className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:outline-none"
                />

                {identifyError && (
                  <p className="text-sm text-red-400" role="alert">
                    {identifyError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-black transition active:scale-95 hover:bg-brand-light disabled:opacity-60"
                >
                  {isPending ? "Continuando..." : "Continuar"}
                </button>
                <p className="text-center text-xs text-white/40">
                  Já tem conta aqui? Faz login. Se não tiver, criamos uma na hora.
                </p>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-2 rounded-full bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setPayTab("pix")}
                  className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${
                    payTab === "pix" ? "bg-brand text-black" : "text-white/70"
                  }`}
                >
                  Pix
                </button>
                <button
                  type="button"
                  onClick={() => setPayTab("credit")}
                  className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${
                    payTab === "credit" ? "bg-brand text-black" : "text-white/70"
                  }`}
                >
                  Cartão de crédito
                </button>
              </div>

              {payTab === "pix" ? (
                <PixPayment onUnlocked={onUnlocked} />
              ) : (
                <CreditCardPayment gnClientId={gnClientId} onUnlocked={onUnlocked} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PixPayment({ onUnlocked }: { onUnlocked: () => void }) {
  const [state, setState] = useState<PixState>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    setState({ step: "loading" });
    startTransition(async () => {
      const result = await createSupporterPixChargeAction();
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
        const res = await fetch(`/api/supporter/status?txid=${result.txid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          onUnlocked();
        }
      }, 4000);
    });
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

function CreditCardPayment({
  gnClientId,
  onUnlocked,
}: {
  gnClientId: string;
  onUnlocked: () => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const efiPay = getEfiPay();
    if (!efiPay) {
      setError("Formulário de cartão ainda carregando, tente novamente em instantes.");
      return;
    }

    const form = e.currentTarget;
    const number = (form.elements.namedItem("number") as HTMLInputElement).value.replace(
      /\s/g,
      ""
    );
    const holderName = (form.elements.namedItem("holderName") as HTMLInputElement).value.trim();
    const holderDocument = (
      form.elements.namedItem("holderDocument") as HTMLInputElement
    ).value.replace(/\D/g, "");
    const phoneNumber = (form.elements.namedItem("phoneNumber") as HTMLInputElement).value.trim();
    const expirationMonth = (
      form.elements.namedItem("expirationMonth") as HTMLInputElement
    ).value.trim();
    const expirationYear = (
      form.elements.namedItem("expirationYear") as HTMLInputElement
    ).value.trim();
    const cvv = (form.elements.namedItem("cvv") as HTMLInputElement).value.trim();

    setStatus("loading");
    setError("");

    try {
      const brand = await efiPay.CreditCard.setCardNumber(number).verifyCardBrand();

      const tokenResult = await efiPay.CreditCard.setAccount(gnClientId)
        .setEnvironment("production")
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
      fd.set("phoneNumber", phoneNumber);

      const result = await chargeSupporterCreditCardAction(null, fd);

      if (result && "success" in result) {
        onUnlocked();
        return;
      }

      setError(result?.error ?? "Não foi possível processar o pagamento.");
      setStatus("error");
    } catch {
      setError("Não foi possível validar o cartão. Confira os dados e tente novamente.");
      setStatus("error");
    }
  };

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
        <input
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          placeholder="Telefone (com DDD)"
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
