import { NextResponse } from "next/server";

// Placeholder: webhook de pagamento Efí Bank.
// O bot Telegram legado já possui webhook + varredor de fallback em produção
// para o mesmo Supabase — ver "What NOT to touch" em CLAUDE.md.
export async function POST(request: Request) {
  await request.json().catch(() => null);
  return NextResponse.json({ ok: true }, { status: 200 });
}
