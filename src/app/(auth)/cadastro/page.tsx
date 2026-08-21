import { CadastroForm } from "@/components/CadastroForm";

export default function CadastroPage() {
  return <CadastroForm googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""} />;
}
