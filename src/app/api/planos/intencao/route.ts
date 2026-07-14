import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { criarIntencaoPlano, type PlanId } from "@/lib/planos";

export async function POST(req: NextRequest) {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const sessionEmail = session?.user?.email;

  let email = "";
  let plan: PlanId = "pro";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    email = String(body.email || sessionEmail || "").trim();
    if (body.plan === "pro" || body.plan === "free") plan = body.plan;
  } else {
    const form = await req.formData();
    email = String(form.get("email") || sessionEmail || "").trim();
    const planForm = String(form.get("plan") || "pro");
    if (planForm === "pro" || planForm === "free") plan = planForm;
  }

  if (!email) {
    return NextResponse.json({ error: "email obrigatório" }, { status: 400 });
  }

  try {
    const { mailtoUrl } = await criarIntencaoPlano({ email, plan, userId: sessionUserId });
    return NextResponse.json({ mailtoUrl });
  } catch {
    return NextResponse.json({ error: "email inválido" }, { status: 400 });
  }
}
