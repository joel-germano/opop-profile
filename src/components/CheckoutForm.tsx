"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  createPixChargeAction,
  chargeCreditCardAction,
} from "@/app/painel/checkout/actions";
import {
  formatBrl,
  formatCardNumber,
  formatCpf,
  formatExpiry,
  isValidCpf,
  parseExpiry,
} from "@/lib/card-format";

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
  priceCents: number;
};

type PixState =
  | { step: "idle" }
  | { step: "ready"; txid: string; pixCopiaECola: string; qrCodeImage: string; expiresAt: number }
  | { step: "expired" }
  | { step: "paid" }
  | { step: "error"; message: string };

const inputClass =
  "w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-white/80">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}

// Comum aos dois meios de pagamento: o que muda é só a mensagem.
function PaidState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-success/10 p-6 text-center ring-1 ring-success/30">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
        <Check size={28} strokeWidth={2.5} />
      </span>
      <div>
        <p className="text-lg font-bold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/60">
          Sua conta agora é Premium. Já pode adicionar quantas molduras quiser.
        </p>
      </div>
      <Link
        href="/painel"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-black transition active:scale-[0.98] hover:bg-brand-light"
      >
        Voltar ao painel
        <ArrowRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function SecurityNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start justify-center gap-2 text-center text-xs leading-snug text-white/40">
      <Lock size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function CheckoutForm({ gnClientId, efiEnvironment, priceCents }: Props) {
  const [tab, setTab] = useState<"pix" | "credit">("pix");

  const tabClass = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
      active ? "bg-brand text-black" : "text-white/70 hover:text-white"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Forma de pagamento"
        className="flex gap-2 rounded-full bg-white/5 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "pix"}
          onClick={() => setTab("pix")}
          className={tabClass(tab === "pix")}
        >
          <QrCode size={16} strokeWidth={2} />
          Pix
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "credit"}
          onClick={() => setTab("credit")}
          className={tabClass(tab === "credit")}
        >
          <CreditCard size={16} strokeWidth={2} />
          Cartão
        </button>
      </div>

      {tab === "pix" ? (
        <PixCheckout priceCents={priceCents} />
      ) : (
        <CreditCardCheckout
          gnClientId={gnClientId}
          efiEnvironment={efiEnvironment}
          priceCents={priceCents}
        />
      )}
    </div>
  );
}

function PixCheckout({ priceCents }: { priceCents: number }) {
  const [state, setState] = useState<PixState>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Contagem regressiva até a cobrança expirar na Efí. Ao zerar, para de
  // consultar o status: continuar batendo na API por um Pix morto só gasta
  // requisição e deixa a tela mentindo que ainda dá pra pagar.
  useEffect(() => {
    if (state.step !== "ready") return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((state.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        stopPolling();
        setState({ step: "expired" });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state, stopPolling]);

  const handleGenerate = () => {
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
        expiresAt: Date.now() + result.expiresInSeconds * 1000,
      });

      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/status?txid=${result.txid}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === "paid") {
            stopPolling();
            setState({ step: "paid" });
            router.refresh();
          }
        } catch {
          // rede instável: ignora e tenta de novo no próximo ciclo
        }
      }, 4000);
    });
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem clipboard (contexto inseguro): o código segue selecionável na tela
    }
  };

  if (state.step === "paid") return <PaidState title="Pagamento confirmado!" />;

  if (state.step === "ready") {
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    const isEndingSoon = secondsLeft <= 300;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
          <Image
            src={state.qrCodeImage}
            alt="QR Code do Pix"
            width={220}
            height={220}
            className="h-52 w-52 rounded-2xl bg-white p-2"
          />

          <p
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              isEndingSoon ? "bg-danger/15 text-danger-light" : "bg-white/10 text-white/70"
            }`}
          >
            Expira em {minutes}:{seconds}
          </p>

          <p className="text-center text-sm leading-snug text-white/60">
            Abra o app do seu banco, escolha <strong className="text-white/80">Pix</strong>{" "}
            e escaneie o QR Code — ou use o código abaixo.
          </p>

          <button
            type="button"
            onClick={() => handleCopy(state.pixCopiaECola)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-black transition active:scale-[0.98] hover:bg-brand-light"
          >
            {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2} />}
            {copied ? "Código copiado!" : "Copiar código Pix"}
          </button>

          <p className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 size={14} className="animate-spin" />
            Aguardando confirmação...
          </p>
        </div>

        <SecurityNote>
          A confirmação é automática — assim que o banco processar, esta tela
          atualiza sozinha.
        </SecurityNote>
      </div>
    );
  }

  if (state.step === "expired") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70">
          <TriangleAlert size={22} strokeWidth={2} />
        </span>
        <div>
          <p className="text-base font-bold text-white">Este Pix expirou</p>
          <p className="mt-1 text-sm text-white/60">
            Nada foi cobrado. Gere um novo código para continuar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-black transition active:scale-[0.98] hover:bg-brand-light disabled:opacity-60"
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          {isPending ? "Gerando..." : "Gerar novo Pix"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-light">
          <QrCode size={24} strokeWidth={2} />
        </span>
        <p className="text-sm leading-snug text-white/60">
          Geramos um QR Code para você pagar pelo app do seu banco. A liberação
          é na hora.
        </p>
      </div>

      {state.step === "error" && (
        <p
          className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger-light"
          role="alert"
        >
          <TriangleAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-bold text-black transition active:scale-[0.98] hover:bg-brand-light disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Gerando Pix...
          </>
        ) : (
          <>Pagar R$ {formatBrl(priceCents)} com Pix</>
        )}
      </button>
    </div>
  );
}

function CreditCardCheckout({ gnClientId, efiEnvironment, priceCents }: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!window.EfiPay) {
      setError("O formulário ainda está carregando. Tente de novo em instantes.");
      setStatus("error");
      return;
    }

    // Checagens locais antes de gastar uma tentativa de cobrança: erro de
    // digitação vira mensagem instantânea em vez de recusa do emissor.
    const parsedExpiry = parseExpiry(expiry);
    if (!parsedExpiry) {
      setError("Validade inválida. Confira o mês e o ano impressos no cartão.");
      setStatus("error");
      return;
    }
    if (!isValidCpf(cpf)) {
      setError("CPF inválido. Confira os números digitados.");
      setStatus("error");
      return;
    }

    const cardDigits = number.replace(/\D/g, "");
    const cpfDigits = cpf.replace(/\D/g, "");

    setStatus("loading");
    setError("");

    try {
      const brand = await window.EfiPay.CreditCard.setCardNumber(cardDigits).verifyCardBrand();

      const tokenResult = await window.EfiPay.CreditCard.setAccount(gnClientId)
        .setEnvironment(efiEnvironment)
        .setCreditCardData({
          brand,
          number: cardDigits,
          cvv,
          expirationMonth: parsedExpiry.month,
          expirationYear: parsedExpiry.year,
          holderName: holderName.trim(),
          holderDocument: cpfDigits,
          reuse: false,
        })
        .getPaymentToken();

      const fd = new FormData();
      fd.set("paymentToken", tokenResult.payment_token);
      fd.set("cardName", holderName.trim());
      fd.set("cpf", cpfDigits);

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

  if (status === "success") return <PaidState title="Pagamento aprovado!" />;

  const isSubmitting = status === "loading";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi-umd.min.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Número do cartão" htmlFor="cc-number">
          <input
            id="cc-number"
            name="number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            required
            disabled={isSubmitting}
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Nome impresso no cartão" htmlFor="cc-name">
          <input
            id="cc-name"
            name="holderName"
            autoComplete="cc-name"
            placeholder="Como está no cartão"
            required
            disabled={isSubmitting}
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Validade" htmlFor="cc-exp">
              <input
                id="cc-exp"
                name="expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                required
                disabled={isSubmitting}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="CVV" htmlFor="cc-cvv">
              <input
                id="cc-cvv"
                name="cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="000"
                maxLength={4}
                required
                disabled={isSubmitting}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <Field label="CPF do titular" htmlFor="cc-cpf">
          <input
            id="cc-cpf"
            name="holderDocument"
            inputMode="numeric"
            placeholder="000.000.000-00"
            required
            disabled={isSubmitting}
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className={inputClass}
          />
        </Field>

        {error && (
          <p
            className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger-light"
            role="alert"
          >
            <TriangleAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!scriptReady || isSubmitting}
          className="mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-bold text-black transition active:scale-[0.98] hover:bg-brand-light disabled:opacity-60 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processando...
            </>
          ) : !scriptReady ? (
            "Carregando..."
          ) : (
            <>Pagar R$ {formatBrl(priceCents)}</>
          )}
        </button>

        <SecurityNote>
          Os dados do cartão vão criptografados direto para a operadora — não
          passam nem ficam guardados no nosso servidor.
        </SecurityNote>
      </form>
    </>
  );
}
