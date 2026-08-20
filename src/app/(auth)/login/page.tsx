import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return <LoginForm googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""} />;
}
