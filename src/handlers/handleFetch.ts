import { Server } from "bun";
import { isValidDecodedToken, parseCookies } from "../utils";
import { decode } from "next-auth/jwt";
import sql from "../db";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

export async function handleFetch(req: Request, server: Server) {
  // Validate origin
  const origin = req.headers.get("origin");
  if (origin !== CORS_ORIGIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Pull jwt token from headers
  const cookies = parseCookies(req.headers.get("Cookie"));
  const sessionToken = cookies["next-auth.session-token"] ?? null;

  if (!sessionToken) {
    return new Response("Missing required token", { status: 400 });
  }

  // Validate token and extract data to set up websocket
  try {
    const decoded = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET || "",
    });

    // Type check decoded token
    if (!isValidDecodedToken(decoded)) {
      return new Response("Invalid token", { status: 401 });
    }

    let { id, orgId } = decoded;

    // get users channels
    try {
      const rows = await sql`
  SELECT "Channel"."id"
  FROM "Channel"
  JOIN "ChannelUser" ON "Channel"."id" = "ChannelUser"."channelId"
  WHERE "ChannelUser"."userId" = ${id}
`;

      const channelIds = rows.map((row) => row.id);

      // Upgrade to websocket
      const success = server.upgrade(req, {
        data: { channels: channelIds, userId: id, orgId },
        // Can add headers here
        //   headers: {
        //     "Set-Cookie": `SessionId=${Date.now()}`,
        //   },
      });

      if (!success) {
        throw new Response("WebSocket upgrade error", { status: 400 });
      }
      // Return undefined if handshake is successful
      return undefined;
    } catch (err) {
      return new Response("Unauthorized", { status: 401 });
    }
  } catch (err) {
    console.error(err);
    return new Response("Error fetching channels", { status: 500 });
  }
}
