import { sanitizeLook } from "@/game/look";
import { currentUser, publicProfile, requireUser } from "@/server/auth";
import { body, db, json, route, str } from "@/server/http";

export const GET = route(async (req: Request) => {
  const user = await currentUser(req);
  return json({ user: user ? publicProfile(user) : null });
});

/** Update display name, bio and avatar look. */
export const PATCH = route(async (req: Request) => {
  const user = await requireUser(req);
  const b = await body<{ displayName: string; bio: string; look: unknown }>(req);
  const displayName = b.displayName === undefined ? user.display_name : str(b.displayName, 24) || user.username;
  const bio = b.bio === undefined ? user.bio : str(b.bio, 160);
  const look = b.look === undefined ? user.look : JSON.stringify(sanitizeLook(b.look));
  await db().prepare("UPDATE users SET display_name = ?, bio = ?, look = ? WHERE id = ?").bind(displayName, bio, look, user.id).run();
  return json({ user: publicProfile({ ...user, display_name: displayName, bio, look }) });
});
