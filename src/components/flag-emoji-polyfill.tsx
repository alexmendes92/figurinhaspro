"use client";

import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";
import { useEffect } from "react";

export default function FlagEmojiPolyfill() {
  useEffect(() => {
    const loaded = polyfillCountryFlagEmojis();
    if (loaded) {
      const current = getComputedStyle(document.body).fontFamily;
      if (!current.includes("Twemoji Country Flags")) {
        document.body.style.fontFamily = `"Twemoji Country Flags", ${current}`;
      }
    }
  }, []);
  return null;
}
