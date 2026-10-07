import { findUser, publicProfile, requireUser } from "@/server/auth";
import { db, fail, json, route } from "@/server/http";

export const GET = route(async (req: Request, ctx: RouteContext<"/api/players/[username]">) => {
  const me = await requireUser(req);
  const { username } = await ctx.params;
  const user = await findUser(username.toLowerCase());
  if (!user) return fail(404, "No player by that name.");
  const blocked = await db().prepare("SELECT 1 FROM blocks WHERE user_id = ? AND blocked_id = ?").bind(me.id, user.id).first();
  return json({ player: publicProfile(user), blocked: !!blocked });
});
