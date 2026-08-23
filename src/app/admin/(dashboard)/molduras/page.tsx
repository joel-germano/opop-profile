import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { TemplateModel } from "@/lib/models/template";
import { AdminTemplateRow } from "@/components/AdminTemplateRow";

export default async function AdminMoldurasPage() {
  await connectDB();

  const users = await UserModel.find({}).select("name username").sort({ name: 1 }).lean();
  const templates = await TemplateModel.find({}).sort({ createdAt: 1 }).lean();

  const templatesByUser = new Map<string, typeof templates>();
  for (const template of templates) {
    const key = String(template.userId);
    templatesByUser.set(key, [...(templatesByUser.get(key) ?? []), template]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Molduras
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {templates.length} moldura(s) em {templatesByUser.size} conta(s).
        </p>
      </div>

      {users.map((user) => {
        const userTemplates = templatesByUser.get(String(user._id)) ?? [];
        if (userTemplates.length === 0) return null;

        return (
          <div key={String(user._id)} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">
              {user.name}{" "}
              <span className="font-normal text-white/50">@{user.username}</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              {userTemplates.map((template) => (
                <AdminTemplateRow
                  key={String(template._id)}
                  templateId={String(template._id)}
                  imageUrl={template.imageUrl}
                />
              ))}
            </div>
          </div>
        );
      })}

      {templates.length === 0 && (
        <p className="text-sm text-white/50">Nenhuma moldura enviada ainda.</p>
      )}
    </div>
  );
}
