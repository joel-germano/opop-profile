"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Script from "next/script";
import { Check, Copy, Gift, Loader2, Minus, Plus, X } from "lucide-react";
import { redeemFrameInviteAction } from "@/app/presidenciaveis/invite-actions";
import { SupporterUnlockHero } from "@/components/SupporterUnlockHero";
import { MAX_FRAME_QUANTITY } from "@/lib/presidenciaveis-constants";
import {
  identifySupporterAction,
  loginWithGoogleAction,
  createSupporterPixChargeAction,
  chargeSupporterCreditCardAction,
  type IdentifyState,
} from "@/app/presidenciaveis/actions";
import {
  formatBrPhone,
  formatCardNumber,
  formatCpf,
  formatExpiry,
  isValidCpf,
  parseExpiry,
} from "@/lib/card-format";

// Não redeclara `Window.EfiPay` global aqui — CheckoutForm.tsx já faz isso e
// os dois precisariam ter exatamente o mesmo shape. Tipo local + cast em vez
// disso, pra manter os dois arquivos independentes.
type EfiPayGlobal = {
  CreditCard: {
    setCardNumber: (number: string) => {
      verifyCardBrand: () => Promise<string>;
    };
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

type Step = "identify" | "pay" | "redeem";
type PayTab = "pix" | "credit";
type PixState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "ready"; txid: string; pixCopiaECola: string; qrCodeImage: string }
  | { step: "error"; message: string };

export function SupporterUnlockModal({
  gnClientId,
  googleClientId,
  priceCents,
  // Já existe sessão de supporter (identificado, só falta pagar) — pula
  // direto pro pagamento. Sem isso, quem já tinha logado antes via a tela
  // de identificação de novo toda vez que reabria esse modal, mesmo com o
  // cookie de sessão ainda válido.
  alreadyIdentified = false,
  // Chegou por um link de convite válido: em vez de cobrar, o modal só
  // identifica a pessoa e resgata o convite (ver redeemFrameInviteAction).
  invite = null,
  // "unlock" (padrão) é a primeira compra — 1 moldura é sempre reservada
  // pra própria pessoa. "topup" é quem já desbloqueou comprando mais
  // convites pra presentear (aberto pelo GiftInviteModal) — muda só a copy,
  // já chega com alreadyIdentified=true e cai direto na etapa de pagamento.
  mode = "unlock",
  onUnlocked,
  onClose,
}: {
  gnClientId: string;
  googleClientId: string;
  priceCents: number;
  alreadyIdentified?: boolean;
  invite?: { token: string; inviterName: string } | null;
  mode?: "unlock" | "topup";
  onUnlocked: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(() => {
    if (invite) return alreadyIdentified ? "redeem" : "identify";
    return alreadyIdentified ? "pay" : "identify";
  });
  const [payTab, setPayTab] = useState<PayTab>("pix");
  const [quantity, setQuantity] = useState(1);
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

  // Resgate do convite: só é chamado depois que existe sessão de supporter
  // (identificado agora ou já de antes) — é o servidor que valida o token e
  // marca como usado, aqui só tratamos o resultado.
  const runRedeem = async () => {
    if (!invite) return;
    const result = await redeemFrameInviteAction(invite.token);
    if (!result.ok) {
      setIdentifyError(result.error);
      setStep("redeem");
      return;
    }
    onUnlocked();
  };

  const handleIdentifyResult = async (result: IdentifyState) => {
    if (!result) return;
    if ("error" in result) {
      setIdentifyError(result.error);
      return;
    }
    if (result.unlocked) {
      onUnlocked();
      return;
    }
    // Quem chegou por convite não passa pelo pagamento: identificou, resgata.
    if (invite) {
      await runRedeem();
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
      await handleIdentifyResult(result);
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
          await handleIdentifyResult(result);
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
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-1 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="scrollbar-none h-[94vh] w-full max-w-sm overflow-hidden overflow-y-auto rounded-3xl bg-[#1c1c1c] shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:h-auto sm:max-h-[85vh]">
        {step === "identify" && !invite ? (
          <SupporterUnlockHero priceCents={priceCents} onClose={onClose} />
        ) : step === "pay" ? (
          // Mesmo cabeçalho personalizado do desbloqueio inicial, tanto pra
          // "unlock" quanto pra "topup" (comprar mais convites pra
          // presentear) — é a mesma cobrança, só muda de onde foi aberta.
          <SupporterUnlockHero onClose={onClose} compact />
        ) : (
          <div className="flex items-center justify-between px-4 py-3 sm:py-4">
            <div className="w-10" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              {invite ? "Convite grátis" : "Desbloquear"}
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
        )}

        <div className="px-6 pb-8">
          {step === "identify" ? (
            <div className="flex flex-col gap-6">
              {invite ? (
                <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/10 p-3 ring-1 ring-secondary/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
                    <Gift size={16} strokeWidth={2} />
                  </div>
                  <p className="text-xs text-white/70">
                    <strong className="text-white">{invite.inviterName}</strong>{" "}
                    te presenteou com uma moldura. Identifique-se pra resgatar —
                    você não paga nada.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-center text-sm text-white/60">
                  Identifique-se pra gerar sua foto de apoio. Cada apoio conta
                  pro seu candidato subir no ranking e ajuda a levar ele ao
                  topo.
                </p>
              )}

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

              <form
                onSubmit={handleEmailSubmit}
                className="flex flex-col gap-3"
              >
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
                  Já tem conta aqui? Faz login. Se não tiver, criamos uma na
                  hora.
                </p>
              </form>
            </div>
          ) : step === "redeem" ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/10 p-3 ring-1 ring-secondary/30">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
                  <Gift size={16} strokeWidth={2} />
                </div>
                <p className="text-xs text-white/70">
                  <strong className="text-white">{invite?.inviterName}</strong>{" "}
                  te presenteou com uma moldura. É só resgatar — você não paga
                  nada.
                </p>
              </div>

              {identifyError && (
                <p className="text-sm text-red-400" role="alert">
                  {identifyError}
                </p>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setIdentifyError("");
                  startTransition(runRedeem);
                }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-secondary text-base font-semibold text-white transition active:scale-95 hover:bg-secondary-dark disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Gift size={18} strokeWidth={2} />
                )}
                {isPending ? "Resgatando..." : "Resgatar minha moldura"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Quantas molduras?
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      Cada uma vale 1 geração, use você ou presenteie.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 disabled:opacity-30"
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="w-5 text-center text-base font-bold tabular-nums text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() =>
                        setQuantity((q) => Math.min(MAX_FRAME_QUANTITY, q + 1))
                      }
                      disabled={quantity >= MAX_FRAME_QUANTITY}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 disabled:opacity-30"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/60">Total</span>
                  <span className="font-bold text-white">
                    R${" "}
                    {((priceCents * quantity) / 100)
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                </div>
              </div>

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
                    payTab === "credit"
                      ? "bg-brand text-black"
                      : "text-white/70"
                  }`}
                >
                  Cartão de crédito
                </button>
              </div>

              {payTab === "pix" ? (
                <PixPayment quantity={quantity} onUnlocked={onUnlocked} />
              ) : (
                <CreditCardPayment
                  gnClientId={gnClientId}
                  quantity={quantity}
                  onUnlocked={onUnlocked}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PixPayment({
  quantity,
  onUnlocked,
}: {
  quantity: number;
  onUnlocked: () => void;
}) {
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
      const result = await createSupporterPixChargeAction(quantity);
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
          className="h-55 w-55 rounded-2xl bg-white p-2"
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
  quantity,
  onUnlocked,
}: {
  gnClientId: string;
  quantity: number;
  onUnlocked: () => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const efiPay = getEfiPay();
    if (!efiPay) {
      setError(
        "Formulário de cartão ainda carregando, tente novamente em instantes.",
      );
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
    const phoneDigits = phoneNumber.replace(/\D/g, "");

    setStatus("loading");
    setError("");

    try {
      const brand =
        await efiPay.CreditCard.setCardNumber(cardDigits).verifyCardBrand();

      const tokenResult = await efiPay.CreditCard.setAccount(gnClientId)
        .setEnvironment("production")
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
      fd.set("phoneNumber", phoneDigits);
      fd.set("quantity", String(quantity));

      const result = await chargeSupporterCreditCardAction(null, fd);

      if (result && "success" in result) {
        onUnlocked();
        return;
      }

      setError(result?.error ?? "Não foi possível processar o pagamento.");
      setStatus("error");
    } catch {
      setError(
        "Não foi possível validar o cartão. Confira os dados e tente novamente.",
      );
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
          placeholder="0000 0000 0000 0000"
          required
          disabled={status === "loading"}
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
        />
        <input
          name="holderName"
          autoComplete="cc-name"
          placeholder="Nome impresso no cartão"
          required
          disabled={status === "loading"}
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
        />
        <div className="flex gap-3">
          <input
            name="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            required
            disabled={status === "loading"}
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
          />
          <input
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVV"
            maxLength={4}
            required
            disabled={status === "loading"}
            value={cvv}
            onChange={(e) =>
              setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
        <input
          name="holderDocument"
          inputMode="numeric"
          placeholder="000.000.000-00"
          required
          disabled={status === "loading"}
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
        />
        <input
          name="phoneNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          required
          disabled={status === "loading"}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatBrPhone(e.target.value))}
          className="w-full rounded-xl bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none"
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
