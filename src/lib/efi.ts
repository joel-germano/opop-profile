import "server-only";
import axios, { type AxiosInstance } from "axios";
import fs from "fs";
import path from "path";
import https from "https";

function resolveCertPath(): string {
  const certName = process.env.GN_CERT;
  if (!certName) {
    throw new Error("GN_CERT não está definida no .env");
  }

  const candidate = path.join(process.cwd(), "certs", certName);
  if (!fs.existsSync(candidate)) {
    throw new Error(
      `Certificado Efí não encontrado em ${candidate}. Salve o .p12 baixado no painel Efí nesse caminho.`
    );
  }

  return candidate;
}

let cachedAgent: https.Agent | null = null;

// Carregado só na primeira cobrança/webhook Pix, não na inicialização do
// servidor — assim a ausência do certificado não derruba páginas que não
// mexem com pagamento.
function getMtlsAgent(): https.Agent {
  if (!cachedAgent) {
    const cert = fs.readFileSync(resolveCertPath());
    cachedAgent = new https.Agent({ pfx: cert, passphrase: "" });
  }
  return cachedAgent;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não está definida no .env`);
  return value;
}

// API Pix (mTLS) — cobranças Pix, QR code e webhook.
async function getPixClient(): Promise<AxiosInstance> {
  const clientID = requireEnv("GN_CLIENT_ID");
  const clientSecret = requireEnv("GN_CLIENT_SECRET");
  const endpoint = requireEnv("GN_ENDPOINT");
  const agent = getMtlsAgent();

  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString("base64");
  const authResponse = await axios.post(
    `${endpoint}/oauth/token`,
    { grant_type: "client_credentials" },
    {
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
      httpsAgent: agent,
    }
  );

  return axios.create({
    baseURL: endpoint,
    httpsAgent: agent,
    headers: {
      Authorization: `Bearer ${authResponse.data.access_token}`,
      "Content-Type": "application/json",
    },
  });
}

// API Cobranças (sem mTLS) — cartão de crédito.
async function getCobrancasClient(): Promise<AxiosInstance> {
  const clientID = requireEnv("GN_CLIENT_ID");
  const clientSecret = requireEnv("GN_CLIENT_SECRET");
  const endpoint = requireEnv("GN_ENDPOINT_APIS");

  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString("base64");
  const authResponse = await axios.post(
    `${endpoint}/v1/authorize`,
    { grant_type: "client_credentials" },
    { headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" } }
  );

  return axios.create({
    baseURL: endpoint,
    headers: {
      Authorization: `Bearer ${authResponse.data.access_token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function createPixCharge({
  amountCents,
  description,
}: {
  amountCents: number;
  description: string;
}) {
  const pix = await getPixClient();
  const pixKey = requireEnv("PIX_CHAVE");

  const cobResponse = await pix.post("/v2/cob", {
    calendario: { expiracao: 3600 },
    valor: { original: (amountCents / 100).toFixed(2) },
    chave: pixKey,
    solicitacaoPagador: description,
  });

  const qrResponse = await pix.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`);

  return {
    txid: cobResponse.data.txid as string,
    pixCopiaECola: qrResponse.data.qrcode as string,
    qrCodeImage: qrResponse.data.imagemQrcode as string,
  };
}

export async function chargeCreditCard({
  amountCents,
  description,
  paymentToken,
  customer,
}: {
  amountCents: number;
  description: string;
  paymentToken: string;
  customer: { name: string; cpf: string; email: string; phoneNumber: string };
}) {
  const cobrancas = await getCobrancasClient();

  const response = await cobrancas.post("/v1/charge/one-step", {
    items: [{ name: description, value: amountCents, amount: 1 }],
    payment: {
      credit_card: {
        customer: {
          name: customer.name,
          cpf: customer.cpf,
          email: customer.email,
          phone_number: customer.phoneNumber,
        },
        installments: 1,
        payment_token: paymentToken,
      },
    },
  });

  return {
    chargeId: String(response.data.data.charge_id),
    status: response.data.data.status as string,
  };
}

export async function ensurePixWebhookRegistered() {
  const pixKey = process.env.PIX_CHAVE;
  const baseWebhookUrl = process.env.PIX_WEBHOOK_URL;
  const webhookSecret = process.env.PIX_WEBHOOK_SECRET;

  if (!pixKey || !baseWebhookUrl) {
    console.warn("[efi] PIX_CHAVE ou PIX_WEBHOOK_URL não configurados — webhook não registrado.");
    return;
  }
  if (!webhookSecret) {
    console.warn("[efi] PIX_WEBHOOK_SECRET não configurado — webhook não registrado (endpoint ficaria sem proteção).");
    return;
  }

  const webhookUrl = `${baseWebhookUrl}?token=${webhookSecret}`;

  try {
    const pix = await getPixClient();
    let currentUrl = "";

    try {
      const current = await pix.get(`/v2/webhook/${encodeURIComponent(pixKey)}`);
      currentUrl = current.data?.webhookUrl ?? "";
    } catch (err) {
      const errorName = axios.isAxiosError(err) ? err.response?.data?.nome : undefined;
      if (errorName !== "webhook_nao_encontrado") throw err;
    }

    if (currentUrl === webhookUrl) {
      console.log(`[efi] Webhook Pix já registrado em ${currentUrl}`);
      return;
    }

    await pix.put(
      `/v2/webhook/${encodeURIComponent(pixKey)}`,
      { webhookUrl },
      { headers: { "x-skip-mtls-checking": "true" } }
    );
    console.log(`[efi] Webhook Pix registrado: ${webhookUrl}`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("[efi] falha ao registrar webhook Pix:", err.response?.data ?? err.message);
    } else {
      console.error("[efi] falha ao registrar webhook Pix:", err);
    }
  }
}
