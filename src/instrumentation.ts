export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Não faz `await` aqui: registrar o webhook faz a Efí chamar de volta essa
  // mesma URL pra validar (ping síncrono). Se isso rodasse dentro de
  // `register()`, o servidor ainda não estaria aceitando conexões quando o
  // ping chegasse — a Efí recebe conexão resetada e recusa o registro. Por
  // isso o delay: dá tempo do servidor ficar pronto antes de disparar.
  setTimeout(() => {
    import("@/lib/efi")
      .then(({ ensurePixWebhookRegistered }) => ensurePixWebhookRegistered())
      .catch((err) => console.error("[instrumentation] falha ao registrar webhook Pix:", err));
  }, 3000);

  // Fluxo paralelo dos presidenciáveis — chave Pix e webhook próprios, ver
  // src/lib/efi-presidenciaveis.ts. Registro independente do acima: uma
  // falha aqui não afeta o webhook do fluxo Premium.
  setTimeout(() => {
    import("@/lib/efi-presidenciaveis")
      .then(({ ensurePixWebhookRegisteredPresidenciaveis }) =>
        ensurePixWebhookRegisteredPresidenciaveis()
      )
      .catch((err) =>
        console.error("[instrumentation] falha ao registrar webhook Pix (presidenciáveis):", err)
      );
  }, 3000);
}
