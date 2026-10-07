import { clearCookie, endSession } from "@/server/auth";
import { json, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  await endSession(req);
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
});
