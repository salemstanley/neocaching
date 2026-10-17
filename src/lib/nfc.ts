import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import { TAG_CODES, TAG_PREFIX, TagCode } from '../game/types';

let busy = false;

export async function nfcStatus(): Promise<'ok' | 'unsupported' | 'off'> {
  try {
    if (!(await NfcManager.isSupported())) return 'unsupported';
    await NfcManager.start();
    return (await NfcManager.isEnabled()) ? 'ok' : 'off';
  } catch {
    return 'unsupported';
  }
}

// Runs fn while the phone is waiting for a tag, then always releases the reader.
async function withTag<T>(fn: () => Promise<T>): Promise<T> {
  if (busy) throw new Error('Already scanning');
  busy = true;
  let requested = false;
  try {
    await NfcManager.start();
    requested = true;
    await NfcManager.requestTechnology(NfcTech.Ndef);
    return await fn();
  } finally {
    try {
      if (requested) await NfcManager.cancelTechnologyRequest();
    } catch {
      // nothing to clean up
    }
    busy = false;
  }
}

export function cancelScan() {
  NfcManager.cancelTechnologyRequest().catch(() => {});
}

// Waits for a tap and returns the Neocaching code on the tag, or null if the
// tag isn't one of ours.
export function readTagCode(): Promise<TagCode | null> {
  return withTag(async () => {
    const tag = await NfcManager.getTag();
    for (const record of tag?.ndefMessage ?? []) {
      let text: string;
      try {
        text = Ndef.text.decodePayload(Uint8Array.from(record.payload));
      } catch {
        continue;
      }
      if (text.startsWith(TAG_PREFIX)) {
        const code = text.slice(TAG_PREFIX.length) as TagCode;
        if (TAG_CODES.includes(code)) return code;
      }
    }
    return null;
  });
}

// Waits for a tap and writes "neocaching:<code>" onto the tag.
export function writeTagCode(code: TagCode): Promise<void> {
  return withTag(async () => {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(TAG_PREFIX + code)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  });
}
