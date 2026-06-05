(function() {
  // NovaDesk Widget v1.0
  const config = window.NovaDesk || {};
  const agentName = config.agentName || 'Nova';
  const color = config.color || '#c8f04d';
  const token = config.token || '';

  // Chat history
  let history = [];
  let isOpen = false;
  let isTyping = false;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #novadesk-widget * { box-sizing: border-box; font-family: 'DM Sans', -apple-system, sans-serif; }
    #novadesk-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px;
      background: ${color}; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 99999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      border: none; outline: none;
    }
    #novadesk-btn:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    #novadesk-btn svg { width: 24px; height: 24px; fill: #000; }
    #novadesk-panel {
      position: fixed; bottom: 96px; right: 24px;
      width: 360px; height: 520px;
      background: #111; border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      z-index: 99998; overflow: hidden;
      transform: scale(0.8) translateY(20px);
      opacity: 0; pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255,255,255,0.1);
    }
    #novadesk-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }
    #nd-header {
      padding: 16px 18px;
      background: ${color}15;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 10px;
    }
    #nd-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: ${color}; color: #000;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    #nd-name { font-weight: 600; font-size: 14px; color: #fff; }
    #nd-status { font-size: 11px; color: ${color}; }
    #nd-close {
      margin-left: auto; background: none; border: none;
      color: #666; cursor: pointer; font-size: 18px; line-height: 1;
      padding: 4px; transition: color 0.2s;
    }
    #nd-close:hover { color: #fff; }
    #nd-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    #nd-messages::-webkit-scrollbar { width: 3px; }
    #nd-messages::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    .nd-msg { display: flex; gap: 8px; align-items: flex-end; }
    .nd-msg.user { flex-direction: row-reverse; }
    .nd-msg-av {
      width: 26px; height: 26px; border-radius: 50%;
      background: ${color}; color: #000;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .nd-msg-av.user-av { background: #2a2a2a; color: #fff; }
    .nd-bubble {
      padding: 10px 14px; border-radius: 14px;
      font-size: 13px; line-height: 1.5; max-width: 78%;
      color: #fff; background: #1e1e1e;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .nd-msg.user .nd-bubble {
      background: ${color}; color: #000; border-color: transparent;
    }
    .nd-typing { display: flex; gap: 4px; align-items: center; padding: 2px 0; }
    .nd-typing span {
      width: 5px; height: 5px; background: #666; border-radius: 50%;
      animation: ndBounce 1.2s infinite;
    }
    .nd-typing span:nth-child(2) { animation-delay: 0.2s; }
    .nd-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ndBounce {
      0%,100% { transform: translateY(0); opacity: 0.4; }
      50% { transform: translateY(-4px); opacity: 1; }
    }
    #nd-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; gap: 8px; align-items: center;
      background: #0e0e0e;
    }
    #nd-input {
      flex: 1; background: #1e1e1e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; padding: 10px 14px;
      color: #fff; font-size: 13px; outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    #nd-input:focus { border-color: ${color}66; }
    #nd-input::placeholder { color: #555; }
    #nd-send {
      width: 36px; height: 36px; border-radius: 10px;
      background: ${color}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
      transition: transform 0.2s;
    }
    #nd-send:hover { transform: scale(1.05); }
    #nd-branding {
      text-align: center; padding: 6px;
      font-size: 10px; color: #333;
    }
    #nd-branding a { color: #444; text-decoration: none; }
    @media (max-width: 480px) {
      #novadesk-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
    }
  `;
  document.head.appendChild(style);

  // Build widget HTML
  const widget = document.createElement('div');
  widget.id = 'novadesk-widget';
  widget.innerHTML = `
    <button id="novadesk-btn" onclick="window.NovaDesk.toggle()">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    <div id="novadesk-panel">
      <div id="nd-header">
        <div id="nd-avatar">${agentName[0]}</div>
        <div>
          <div id="nd-name">${agentName}</div>
          <div id="nd-status">● Online — replies instantly</div>
        </div>
        <button id="nd-close" onclick="window.NovaDesk.toggle()">×</button>
      </div>
      <div id="nd-messages"></div>
      <div id="nd-input-area">
        <input type="text" id="nd-input" placeholder="Ask a question..." />
        <button id="nd-send" onclick="window.NovaDesk.send()">→</button>
      </div>
      <div id="nd-branding">Powered by <a href="https://novadesk-azure.vercel.app" target="_blank">NovaDesk</a></div>
    </div>
  `;
  document.body.appendChild(widget);

  // Add welcome message
  addBotMessage(`Hi there! 👋 I'm ${agentName}. How can I help you today?`);

  // Input enter key
  document.getElementById('nd-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') window.NovaDesk.send();
  });

  function addBotMessage(text) {
    const msgs = document.getElementById('nd-messages');
    const div = document.createElement('div');
    div.className = 'nd-msg';
    div.innerHTML = `
      <div class="nd-msg-av">${agentName[0]}</div>
      <div class="nd-bubble">${text}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMessage(text) {
    const msgs = document.getElementById('nd-messages');
    const div = document.createElement('div');
    div.className = 'nd-msg user';
    div.innerHTML = `
      <div class="nd-msg-av user-av">Y</div>
      <div class="nd-bubble">${text}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('nd-messages');
    const div = document.createElement('div');
    div.className = 'nd-msg';
    div.id = 'nd-typing';
    div.innerHTML = `
      <div class="nd-msg-av">${agentName[0]}</div>
      <div class="nd-bubble"><div class="nd-typing"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('nd-typing');
    if (el) el.remove();
  }

  async function getReply(msg) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ANTHROPIC_API_KEY',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          system: `You are ${agentName}, a helpful customer support agent for this store. Be friendly, concise and helpful. Give specific varied answers. Keep responses under 3 sentences.`,
          messages: [...history.slice(-6), { role: 'user', content: msg }]
        })
      });
      const data = await res.json();
      const reply = data.content[0].text;
      history.push({ role: 'user', content: msg });
      history.push({ role: 'assistant', content: reply });
      return reply;
    } catch(e) {
      // Smart fallback
      const m = msg.toLowerCase();
      if (m.includes('order') || m.includes('track')) return "I'd love to help! Could you share your order number so I can look that up for you?";
      if (m.includes('return') || m.includes('refund')) return "We accept returns within 30 days. Just share your order number and I'll get that started!";
      if (m.includes('ship') || m.includes('deliver')) return "Standard shipping takes 5-7 business days. Express (2-3 days) is also available at checkout!";
      if (m.includes('payment') || m.includes('pay')) return "We accept all major cards, PayPal, and Apple Pay — all secured with SSL encryption.";
      return "Thanks for reaching out! Could you give me a bit more detail so I can help you better?";
    }
  }

  // Public API
  window.NovaDesk = {
    ...config,
    toggle: function() {
      isOpen = !isOpen;
      document.getElementById('novadesk-panel').classList.toggle('open', isOpen);
    },
    send: async function() {
      if (isTyping) return;
      const input = document.getElementById('nd-input');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      addUserMessage(msg);
      isTyping = true;
      showTyping();
      const reply = await getReply(msg);
      hideTyping();
      addBotMessage(reply);
      isTyping = false;
    }
  };
})();
