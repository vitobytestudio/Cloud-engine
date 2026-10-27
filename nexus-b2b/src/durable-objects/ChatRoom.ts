// ——— غرفة محادثة حية: WebSocket عبر Durable Object + استمرارية في D1 ———
import type { Env } from "../env";

export class ChatRoom {
  private sockets: Set<WebSocket> = new Set();
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/notify") {
      const ev = (await req.json().catch(() => null)) as { t?: string; message?: unknown } | null;
      if (ev) this.broadcast(JSON.stringify(ev));
      return new Response("ok");
    }

    if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      this.sockets.add(pair[1]);
      pair[1].accept();
      pair[1].addEventListener("message", (ev) => this.onMessage(pair[1], String(ev.data)).catch(() => {}));
      pair[1].addEventListener("close", () => this.sockets.delete(pair[1]));
      pair[1].addEventListener("error", () => this.sockets.delete(pair[1]));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    return new Response("bad request", { status: 400 });
  }

  private broadcast(data: string, except?: WebSocket): void {
    for (const ws of this.sockets) {
      if (ws === except) continue;
      try { ws.send(data); } catch { this.sockets.delete(ws); }
    }
  }

  private async onMessage(ws: WebSocket, raw: string): Promise<void> {
    let m: { t?: string; conv_id?: string; user_id?: string; content?: string; type?: string; deal_title?: string; deal_amount_cents?: number };
    try { m = JSON.parse(raw); } catch { return; }

    if (m.t === "typing") {
      this.broadcast(JSON.stringify({ t: "typing", user_id: m.user_id }), ws);
      return;
    }
    if (m.t === "msg" && m.conv_id && m.user_id && (m.content ?? "").trim()) {
      // تحقق الانتماء للمحادثة ثم استمرارية في D1 ثم بث للجميع
      const c = await this.env.DB.prepare("SELECT participant_one, participant_two FROM conversations WHERE id=?")
        .bind(m.conv_id).first<{ participant_one: string; participant_two: string }>();
      if (!c || (c.participant_one !== m.user_id && c.participant_two !== m.user_id)) {
        ws.send(JSON.stringify({ t: "error", error: "forbidden" }));
        return;
      }
      const id = `m-${crypto.randomUUID().slice(0, 12)}`;
      await this.env.DB.prepare(
        `INSERT INTO messages (id,conversation_id,sender_id,content,message_type) VALUES (?,?,?,?,'TEXT')`
      ).bind(id, m.conv_id, m.user_id, (m.content ?? "").slice(0, 1000)).run();
      await this.env.DB.prepare("UPDATE conversations SET last_message_at=datetime('now') WHERE id=?").bind(m.conv_id).run();
      const full = await this.env.DB.prepare(
        "SELECT m.*, u.username, u.full_name, u.avatar_color FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
      ).bind(id).first();
      this.broadcast(JSON.stringify({ t: "msg", message: full }));
    }
  }
}
