// Keep copying available in local previews and native modal dialogs.
export async function copyText(text) {
  const previous = document.activeElement;
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('aria-hidden', 'true');
  input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
  (document.querySelector('dialog[open]') || document.body).append(input);
  let copied = false;
  try { input.focus(); input.select(); copied = document.execCommand('copy'); }
  catch { /* Use the async clipboard API if the synchronous path is unavailable. */ }
  finally { input.remove(); previous?.focus({ preventScroll: true }); }
  if (!copied) await navigator.clipboard.writeText(text);
}
