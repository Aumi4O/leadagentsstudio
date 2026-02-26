/**
 * SmartLine Enterprise Agent — Native Component
 * Chat + Voice, shared memory, Lead Agents Studio design
 * No iframe. Uses API at lead-agents-api.onrender.com
 */
(function () {
  const API_BASE = window.SMARTLINE_API_BASE || 'https://lead-agents-api.onrender.com';

  function createWidget(container) {
    const apiBase = container.dataset.apiBase || API_BASE;
    const root = document.createElement('div');
    root.className = 'smartline-agent-widget';
    root.innerHTML = `
      <div class="agent-window smartline-native">
        <div class="agent-window-header">
          <div class="agent-avatar" aria-hidden="true">SL</div>
          <div class="agent-info">
            <h3>SmartLine Enterprise Agent</h3>
            <span>Chat or talk — same conversation</span>
          </div>
        </div>
        <div class="agent-waveform sl-waveform">
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </div>
        <div class="agent-window-body">
          <div class="agent-messages sl-messages"></div>
          <div class="agent-mic-notice sl-mic-notice">
            <p><strong>Voice mode:</strong> Your browser will ask for microphone access so you can speak to SmartLine. This is for security—only you hear your conversation. We never record without your consent.</p>
          </div>
          <div class="agent-input-row">
            <input type="text" class="sl-chat-input" placeholder="Type your message..." autocomplete="off">
            <button type="button" class="btn-send sl-send-btn" title="Send">Send</button>
            <button type="button" class="btn-voice sl-voice-btn" title="Start voice">
              <span class="mic-icon">🎤</span>
              <span class="btn-label">Voice</span>
            </button>
          </div>
          <p class="agent-status sl-status"></p>
        </div>
      </div>
    `;
    container.appendChild(root);
    return root;
  }

  async function init() {
    const containers = document.querySelectorAll('[data-smartline-agent]');
    if (!containers.length) return;
    containers.forEach((c) => {
      const widget = createWidget(c);
      attachHandlers(widget, c.dataset.apiBase || API_BASE);
    });
  }

  function attachHandlers(root, apiBase) {
    const chatInput = root.querySelector('.sl-chat-input');
    const sendBtn = root.querySelector('.sl-send-btn');
    const voiceBtn = root.querySelector('.sl-voice-btn');
    const messagesEl = root.querySelector('.sl-messages');
    const statusEl = root.querySelector('.sl-status');
    const micNotice = root.querySelector('.sl-mic-notice');
    const waveform = root.querySelector('.sl-waveform');

    let conversationId = null;
    let session = null;
    let isVoiceActive = false;

    function setStatus(msg, isError = false) {
      statusEl.textContent = msg;
      statusEl.className = 'agent-status' + (isError ? ' error' : '');
    }

    function addMessageToUI(role, content) {
      const div = document.createElement('div');
      div.className = 'agent-msg ' + (role === 'user' ? 'agent-msg-user' : 'agent-msg-assistant');
      const p = document.createElement('p');
      p.textContent = content;
      div.appendChild(p);
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function ensureSession() {
      if (conversationId) return conversationId;
      const res = await fetch(`${apiBase}/api/smartline/session`, { method: 'POST' });
      const data = await res.json();
      conversationId = data.conversationId;
      return conversationId;
    }

    async function sendChat() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      addMessageToUI('user', text);
      chatInput.disabled = true;
      setStatus('Thinking...');
      try {
        await ensureSession();
        const res = await fetch(`${apiBase}/api/smartline/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, message: text })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        addMessageToUI('assistant', data.response);
        setStatus('');
      } catch (err) {
        setStatus(err.message || 'Something went wrong', true);
      }
      chatInput.disabled = false;
    }

    async function startVoice() {
      voiceBtn.disabled = true;
      micNotice.style.display = 'block';
      setStatus('Connecting...');
      try {
        await ensureSession();
        const url = `${apiBase}/api/smartline/token?conversationId=${encodeURIComponent(conversationId)}`;
        const tokenRes = await fetch(url);
        if (!tokenRes.ok) throw new Error('Voice API unavailable — try again in a moment');
        const { token } = await tokenRes.json();
        if (!token) throw new Error('Voice API unavailable — try again in a moment');

        const { RealtimeAgent, RealtimeSession, tool } = await import('https://esm.sh/@openai/agents@0.4.11/realtime');
        const { z } = await import('https://esm.sh/zod@3.23.8');

        const toolFetch = (name, args) =>
          fetch(`${apiBase}/api/smartline/tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolName: name, args })
          }).then(r => r.json()).then(r => JSON.stringify(r));

        const agent = new RealtimeAgent({
          name: 'SmartLine Enterprise Agent',
          instructions: 'You are SmartLine Enterprise Agent. Professional, trusted. Use your tools. 2-3 sentences max.',
          tools: [
            tool({ name: 'lookup_services', description: 'Look up SmartLine services, pricing.', parameters: z.object({ query: z.string(), category: z.string().optional() }), execute: ({ query, category }) => toolFetch('lookup_services', { query, category }) }),
            tool({ name: 'lookup_faq', description: 'Look up FAQs.', parameters: z.object({ question: z.string(), topic: z.string().optional() }), execute: ({ question, topic }) => toolFetch('lookup_faq', { question, topic }) }),
            tool({ name: 'lookup_objection', description: 'Objection handling.', parameters: z.object({ objection: z.string() }), execute: ({ objection }) => toolFetch('lookup_objection', { objection }) }),
            tool({ name: 'lookup_case_study', description: 'Case studies.', parameters: z.object({ industry: z.string().optional(), topic: z.string().optional() }), execute: (a) => toolFetch('lookup_case_study', a) }),
            tool({ name: 'lookup_client_info', description: 'SmartLine info.', parameters: z.object({ field: z.string().optional() }), execute: ({ field }) => toolFetch('lookup_client_info', { field }) })
          ]
        });

        session = new RealtimeSession(agent, { transport: 'webrtc', model: 'gpt-realtime', config: { audio: { output: { voice: 'shimmer' } } } });
        await session.connect({ apiKey: token });
        isVoiceActive = true;
        voiceBtn.classList.add('recording');
        voiceBtn.querySelector('.btn-label').textContent = 'End voice';
        waveform.classList.add('talking');
        setStatus('Speak now. Click End when done.');
      } catch (err) {
        const msg = err.message || '';
        const isApiError = /token|fetch|network|connection|unavailable/i.test(msg);
        setStatus(isApiError ? 'Voice API unavailable — try again in a moment' : msg, true);
        voiceBtn.disabled = false;
      }
    }

    function endVoice() {
      try {
        if (session) {
          try { session.close(); } catch (e) { console.warn('Session close:', e); }
          session = null;
        }
      } finally {
        isVoiceActive = false;
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.btn-label').textContent = 'Voice';
        voiceBtn.disabled = false;
        waveform.classList.remove('talking');
        setStatus('');
      }
    }

    function toggleVoice(e) {
      e.preventDefault();
      e.stopPropagation();
      if (isVoiceActive) endVoice();
      else startVoice();
    }

    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
    sendBtn.addEventListener('click', sendChat);
    voiceBtn.addEventListener('click', toggleVoice);
    voiceBtn.addEventListener('touchend', (e) => { e.preventDefault(); toggleVoice(e); }, { passive: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
