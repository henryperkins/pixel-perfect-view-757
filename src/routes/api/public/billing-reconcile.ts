import { createFileRoute } from "@tanstack/react-router";
export const Route=createFileRoute("/api/public/billing-reconcile")({server:{handlers:{POST:async({request})=>{
  const {createHmac,timingSafeEqual}=await import("node:crypto");
  const secret=process.env["PATTERN_WORKFLOW_SECRET"],raw=await request.text();
  const signature=request.headers.get("x-pattern-signature") ?? "";
  if (!secret || !/^[a-f0-9]{64}$/.test(signature)) return new Response("Unauthorized",{status:401});
  const expected=createHmac("sha256",secret).update(raw).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) return new Response("Unauthorized",{status:401});
  let input;
  try {input=JSON.parse(raw) as {issuedAt?:number;environment?:string};} catch {return new Response("Invalid request",{status:400});}
  if (!input.issuedAt || Math.abs(Date.now()-input.issuedAt)>60_000 || !["sandbox","live"].includes(input.environment ?? "")) return new Response("Expired request",{status:400});
  const env=input.environment;
  if (env!=="sandbox" && env!=="live") return new Response("Invalid environment",{status:400});
  try {return Response.json(await (await import("@/lib/billing.server")).reconcileBilling(env));}
  catch {return new Response("Reconciliation unavailable",{status:503});}
}}}});