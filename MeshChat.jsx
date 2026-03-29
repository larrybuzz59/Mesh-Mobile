import { useState, useRef, useEffect } from "react";

/* ─────────────────────────── DESIGN TOKENS ─────────────────────────── */
const T = {
  bg: "#F5F4F0",
  surface: "#FFFFFF",
  surfaceAlt: "#EDECEA",
  brand: "#2D6A4F",
  brandLight: "#52B788",
  brandPale: "#D8F3DC",
  sent: "#2D6A4F",
  sentText: "#FFFFFF",
  received: "#FFFFFF",
  receivedText: "#1A1A1A",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textMuted: "#AAAAAA",
  border: "#E4E2DE",
  danger: "#E63946",
  online: "#52B788",
  offline: "#F4A261",
  shadow: "0 2px 12px rgba(0,0,0,0.08)",
  radius: "20px",
  radiusSm: "12px",
  font: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
};

/* ─────────────────────────── MOCK DATA ─────────────────────────── */
const CONTACTS = [
  { id: 1, name: "Maria Santos", avatar: "MS", lastSeen: "online", bio: "Nearby · 3m away" },
  { id: 2, name: "James Okafor", avatar: "JO", lastSeen: "2 min ago", bio: "Nearby · 12m away" },
  { id: 3, name: "Yuki Tanaka", avatar: "YT", lastSeen: "5 min ago", bio: "Nearby · 28m away" },
  { id: 4, name: "Priya Nair", avatar: "PN", lastSeen: "15 min ago", bio: "Nearby · 45m away" },
  { id: 5, name: "Carlos Ruiz", avatar: "CR", lastSeen: "1 hr ago", bio: "Nearby · 92m away" },
];

const INITIAL_CHATS = [
  {
    id: 1, contactId: 1,
    messages: [
      { id: 1, text: "Hey! Are you coming to the market today?", fromMe: false, time: "10:12", status: "delivered" },
      { id: 2, text: "Yes! Heading there in about 20 mins", fromMe: true, time: "10:14", status: "delivered" },
      { id: 3, text: "Perfect, I'll save you a spot 😊", fromMe: false, time: "10:15", status: "delivered" },
    ],
  },
  {
    id: 2, contactId: 2,
    messages: [
      { id: 1, text: "Did you see the game last night?", fromMe: false, time: "Yesterday", status: "delivered" },
      { id: 2, text: "Missed it! Was the score good?", fromMe: true, time: "Yesterday", status: "read" },
    ],
  },
  {
    id: 3, contactId: 3,
    messages: [
      { id: 1, text: "The mesh network is working great here!", fromMe: false, time: "Mon", status: "delivered" },
    ],
  },
];

/* ─────────────────────────── HELPERS ─────────────────────────── */
const getContact = (id) => CONTACTS.find((c) => c.id === id);
const lastMsg = (chat) => chat.messages[chat.messages.length - 1];
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const AvatarBubble = ({ name, size = 42, fontSize = 15 }) => {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue}, 45%, 55%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize, flexShrink: 0,
      fontFamily: T.font,
    }}>
      {initials}
    </div>
  );
};

const StatusDot = ({ status }) => {
  const color = status === "online" ? T.online : T.textMuted;
  return <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block", marginRight: 5, flexShrink: 0 }} />;
};

const DeliveryIcon = ({ status }) => {
  if (status === "sent") return <span style={{ color: T.sentText, opacity: 0.7, fontSize: 11 }}>✓</span>;
  if (status === "relayed") return <span style={{ color: T.sentText, opacity: 0.7, fontSize: 11 }}>✓✓</span>;
  if (status === "delivered") return <span style={{ color: "#90CAF9", fontSize: 11 }}>✓✓</span>;
  if (status === "read") return <span style={{ color: "#64B5F6", fontSize: 11, fontWeight: 700 }}>✓✓</span>;
  return null;
};

const ConnectionBanner = ({ mode, peers }) => (
  <div style={{
    background: mode === "online" ? T.brandPale : "#FFF3E0",
    padding: "6px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: 12, color: mode === "online" ? T.brand : "#E65100",
    borderBottom: `1px solid ${T.border}`,
    fontFamily: T.font, fontWeight: 500,
  }}>
    <span>
      {mode === "online"
        ? "🌐 Internet Mode (Online)"
        : "🔗 Mesh Mode (Offline)"}
    </span>
    <span style={{ opacity: 0.8 }}>{peers} nearby peers</span>
  </div>
);

/* ─────────────────────────── SCREENS ─────────────────────────── */

/* CHAT LIST */
const ChatListScreen = ({ chats, onOpenChat, onNav, mode, peers }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, fontFamily: T.font }}>
    <div style={{ background: T.brand, padding: "16px 20px 12px", color: "#fff" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>MeshChat</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Secure · Peer-to-peer</div>
    </div>
    <ConnectionBanner mode={mode} peers={peers} />

    <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
      {chats.map((chat) => {
        const contact = getContact(chat.contactId);
        const msg = lastMsg(chat);
        return (
          <div key={chat.id}
            onClick={() => onOpenChat(chat.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", background: T.surface,
              borderBottom: `1px solid ${T.border}`, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <AvatarBubble name={contact.name} size={50} fontSize={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: T.textPrimary }}>{contact.name}</span>
                <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{msg.time}</span>
              </div>
              <div style={{ fontSize: 14, color: T.textSecondary, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {msg.fromMe ? "You: " : ""}{msg.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <BottomNav active="chats" onNav={onNav} />
  </div>
);

/* INDIVIDUAL CHAT */
const ChatScreen = ({ chat, onBack, mode, peers }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(chat.messages);
  const contact = getContact(chat.contactId);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id: Date.now(), text: input.trim(), fromMe: true, time: now(), status: "sent" }]);
    setInput("");
    // Simulate delivery
    setTimeout(() => setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, status: "relayed" } : msg)), 800);
    setTimeout(() => setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, status: "delivered" } : msg)), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, fontFamily: T.font }}>
      {/* Header */}
      <div style={{ background: T.brand, padding: "12px 16px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>←</button>
        <AvatarBubble name={contact.name} size={38} fontSize={13} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{contact.name}</div>
          <div style={{ fontSize: 12, opacity: 0.8, display: "flex", alignItems: "center" }}>
            <StatusDot status={contact.lastSeen === "online" ? "online" : "offline"} />
            {contact.lastSeen}
          </div>
        </div>
      </div>
      <ConnectionBanner mode={mode} peers={peers} />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.fromMe ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%", padding: "10px 14px 8px",
              borderRadius: msg.fromMe
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              background: msg.fromMe ? T.sent : T.received,
              color: msg.fromMe ? T.sentText : T.receivedText,
              boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
              wordBreak: "break-word",
            }}>
              <div style={{ fontSize: 15, lineHeight: 1.45 }}>{msg.text}</div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.7, color: msg.fromMe ? T.sentText : T.textMuted }}>{msg.time}</span>
                {msg.fromMe && <DeliveryIcon status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: "10px 12px", background: T.surface,
        borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          flex: 1, background: T.surfaceAlt, borderRadius: 24,
          display: "flex", alignItems: "center", padding: "8px 16px",
          border: `1px solid ${T.border}`,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message…"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 15, color: T.textPrimary, outline: "none",
              fontFamily: T.font,
            }}
          />
          <button style={{
            background: "none", border: "none", fontSize: 18, cursor: "pointer",
            color: T.textMuted, padding: 0, marginLeft: 4,
          }} title="Voice note">🎙</button>
        </div>
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            width: 46, height: 46, borderRadius: "50%",
            background: input.trim() ? T.brand : T.surfaceAlt,
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, transition: "background 0.2s", flexShrink: 0,
            boxShadow: input.trim() ? `0 2px 8px ${T.brand}55` : "none",
          }}
        >
          <span style={{ color: input.trim() ? "#fff" : T.textMuted }}>➤</span>
        </button>
      </div>
    </div>
  );
};

/* CONTACTS / PEERS */
const ContactsScreen = ({ onNav, mode, peers }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, fontFamily: T.font }}>
    <div style={{ background: T.brand, padding: "16px 20px 12px", color: "#fff" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Nearby Peers</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{peers} devices found via mesh</div>
    </div>
    <ConnectionBanner mode={mode} peers={peers} />

    <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
      {CONTACTS.map((contact) => (
        <div key={contact.id} style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px", background: T.surface,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ position: "relative" }}>
            <AvatarBubble name={contact.name} size={50} fontSize={16} />
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 12, height: 12, borderRadius: "50%",
              background: contact.lastSeen === "online" ? T.online : T.textMuted,
              border: "2px solid #fff",
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: T.textPrimary }}>{contact.name}</div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{contact.bio}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{contact.lastSeen}</div>
          </div>
          <div style={{
            padding: "7px 16px", borderRadius: 20,
            background: T.brandPale, color: T.brand,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${T.brandLight}40`,
          }}>
            Chat
          </div>
        </div>
      ))}
    </div>
    <BottomNav active="contacts" onNav={onNav} />
  </div>
);

/* SETTINGS */
const SettingsScreen = ({ onNav, mode, setMode, peers, setPeers }) => {
  const rows = [
    { icon: "👤", label: "Profile", sub: "Name, avatar, status" },
    { icon: "🔔", label: "Notifications", sub: "Sounds, alerts" },
    { icon: "🔒", label: "Privacy & Security", sub: "End-to-end encryption" },
    { icon: "📡", label: "Mesh Settings", sub: "Bluetooth, Wi-Fi Direct" },
    { icon: "💾", label: "Storage", sub: "Manage media & data" },
    { icon: "❓", label: "Help", sub: "FAQ and support" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, fontFamily: T.font }}>
      <div style={{ background: T.brand, padding: "16px 20px 12px", color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Settings</div>
      </div>
      <ConnectionBanner mode={mode} peers={peers} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Profile Card */}
        <div style={{ background: T.surface, margin: "12px 0 0", padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", borderBottom: `1px solid ${T.border}` }}>
          <AvatarBubble name="You" size={56} fontSize={18} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.textPrimary }}>My Profile</div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>Tap to edit your details</div>
          </div>
        </div>

        {/* Connection Toggle */}
        <div style={{ background: T.surface, margin: "10px 0 0", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Connection Mode</div>
          <div style={{ display: "flex", gap: 10 }}>
            {["online", "offline"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "10px 0", borderRadius: T.radiusSm,
                border: `2px solid ${mode === m ? T.brand : T.border}`,
                background: mode === m ? T.brandPale : T.surfaceAlt,
                color: mode === m ? T.brand : T.textSecondary,
                fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: T.font,
              }}>
                {m === "online" ? "🌐 Internet" : "🔗 Mesh"}
              </button>
            ))}
          </div>
        </div>

        {/* Peers Slider */}
        <div style={{ background: T.surface, margin: "10px 0 0", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Nearby Peers: <span style={{ color: T.brand }}>{peers}</span>
          </div>
          <input type="range" min={0} max={12} value={peers} onChange={e => setPeers(+e.target.value)}
            style={{ width: "100%", accentColor: T.brand }} />
        </div>

        {/* Settings List */}
        <div style={{ background: T.surface, margin: "10px 0 0" }}>
          {rows.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "15px 20px", borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
              cursor: "pointer",
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = T.surface}
            >
              <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.textPrimary }}>{row.label}</div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 1 }}>{row.sub}</div>
              </div>
              <span style={{ color: T.textMuted, fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px", textAlign: "center", color: T.textMuted, fontSize: 12 }}>
          MeshChat v1.0.0 · End-to-end encrypted
        </div>
      </div>
      <BottomNav active="settings" onNav={onNav} />
    </div>
  );
};

/* BOTTOM NAV */
const BottomNav = ({ active, onNav }) => {
  const tabs = [
    { key: "chats", icon: "💬", label: "Chats" },
    { key: "contacts", icon: "👥", label: "Peers" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];
  return (
    <div style={{
      display: "flex", background: T.surface,
      borderTop: `1px solid ${T.border}`,
      paddingBottom: 6,
    }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onNav(tab.key)} style={{
          flex: 1, background: "none", border: "none",
          padding: "10px 0 6px", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          fontFamily: T.font,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1, filter: active === tab.key ? "none" : "grayscale(1) opacity(0.5)" }}>{tab.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: active === tab.key ? T.brand : T.textMuted, letterSpacing: "0.2px" }}>{tab.label}</span>
          {active === tab.key && (
            <span style={{ width: 20, height: 3, borderRadius: 2, background: T.brand, marginTop: 1 }} />
          )}
        </button>
      ))}
    </div>
  );
};

/* ─────────────────────────── APP ROOT ─────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState("chats"); // chats | chat | contacts | settings
  const [activeChatId, setActiveChatId] = useState(null);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [mode, setMode] = useState("offline"); // online | offline
  const [peers, setPeers] = useState(5);

  const openChat = (id) => { setActiveChatId(id); setScreen("chat"); };
  const nav = (s) => setScreen(s);

  const activeChat = chats.find(c => c.id === activeChatId);

  const phoneStyle = {
    width: 375, height: 720,
    borderRadius: 40,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 10px #1a1a1a, 0 0 0 12px #333",
    position: "relative",
    fontFamily: T.font,
    display: "flex", flexDirection: "column",
    background: T.bg,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: T.font,
      padding: 20,
    }}>
      {/* Phone Frame */}
      <div style={phoneStyle}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 120, height: 28, background: "#1a1a1a", borderRadius: "0 0 18px 18px",
          zIndex: 100,
        }} />
        <div style={{ height: 28, flexShrink: 0 }} />

        {/* Screen Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {screen === "chats" && (
            <ChatListScreen chats={chats} onOpenChat={openChat} onNav={nav} mode={mode} peers={peers} />
          )}
          {screen === "chat" && activeChat && (
            <ChatScreen chat={activeChat} onBack={() => setScreen("chats")} mode={mode} peers={peers} />
          )}
          {screen === "contacts" && (
            <ContactsScreen onNav={nav} mode={mode} peers={peers} />
          )}
          {screen === "settings" && (
            <SettingsScreen onNav={nav} mode={mode} setMode={setMode} peers={peers} setPeers={setPeers} />
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "8px 20px",
        color: "#fff", fontSize: 12, backdropFilter: "blur(8px)",
        display: "flex", gap: 20,
      }}>
        <span>✓ Sent</span>
        <span>✓✓ Relayed</span>
        <span style={{ color: "#90CAF9" }}>✓✓ Delivered</span>
      </div>
    </div>
  );
}
