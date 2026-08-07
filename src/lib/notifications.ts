export const ADHAN_URL = "https://www.islamcan.com/audio/adhan/azan2.mp3";

export type NotificationPrefs = {
  prayers: boolean;
  azkar: boolean;
  hadith: boolean;
  adhanSound: boolean;
  beforeMinutes: number;
};

export const defaultPrefs: NotificationPrefs = {
  prayers: true,
  azkar: true,
  hadith: true,
  adhanSound: true,
  beforeMinutes: 10,
};

const PREFS_KEY = "emty-notify-prefs";

export function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function requestPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notify(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      ...(tag ? { tag } : {}),
      icon: "/favicon.ico",
      dir: "rtl",
      lang: "ar",
    });
  } catch {
    /* ignore */
  }
}

const firedKey = (id: string) => `emty-fired-${id}-${new Date().toDateString()}`;

export function fireOnce(id: string, fn: () => void) {
  if (typeof window === "undefined") return;
  const key = firedKey(id);
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  fn();
}

let adhanAudio: HTMLAudioElement | null = null;

export function playAdhan() {
  if (typeof window === "undefined") return;
  try {
    adhanAudio ??= new Audio(ADHAN_URL);
    adhanAudio.currentTime = 0;
    void adhanAudio.play();
  } catch {
    /* ignore */
  }
}

export function stopAdhan() {
  adhanAudio?.pause();
}
