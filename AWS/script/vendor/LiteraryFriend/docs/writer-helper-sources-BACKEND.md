# Onyx / AI-Brain integration

Backend endpoint used by `js/ai-brain-provider-bridge.js`:

`https://script.google.com/macros/s/AKfycbwxviV1hERFKIivY5we5W1gVMqfsH6DNY0mNZkEs2SXcoa4gDM88c14tIyraytnSAyKvQ/exec`

The supplied tested backend was audited. Its current authoritative AI generation route is `onyx.chat`, not the legacy `writer.create`, `writer.continue` or `writer.generate` routes that survived in an earlier frontend adapter. The final bridge therefore:

1. builds the William-voice + craft prompt locally;
2. obtains the existing authenticated OurSpace session token from the explicit request/global/local storage when available;
3. POSTs `action: "onyx.chat"`, `useBrain: true`, and the bounded writer context;
4. converts `response` / `onyxReply` back to generic content or chapter-shaped output;
5. runs the William voice/craft governor on returned text;
6. falls back to the static JavaScript brain when authentication, network access, backend routing or AI-Brain generation fails.

No backend `.gs` replacement is included. The supplied backend remains authoritative.
