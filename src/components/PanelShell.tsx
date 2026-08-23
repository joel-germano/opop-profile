export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <div
        className="flex w-full flex-col overflow-x-hidden md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <main className="flex-1 px-6 pb-40">{children}</main>
      </div>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
