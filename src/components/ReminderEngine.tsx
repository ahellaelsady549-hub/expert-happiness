import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCoords, usePrayerTimings } from "@/lib/use-prayer";
import { prayerNames, prayerOrder, toDate, type PrayerKey } from "@/lib/prayer";
import { fireOnce, loadPrefs, notify, playAdhan } from "@/lib/notifications";
import { fetchHadiths, hadithOfTheDay } from "@/lib/hadith";
import { tipOfTheDay } from "@/data/tips";

/** Background engine: prayer reminders, adhan, azkar + hadith of the day notifications. */
export function ReminderEngine() {
  const { coords } = useCoords();
  const { data: timings } = usePrayerTimings(coords);
  const timingsRef = useRef(timings);
  timingsRef.current = timings;

  useEffect(() => {
    const tick = () => {
      const prefs = loadPrefs();
      const now = new Date();
      const t = timingsRef.current;

      if (t && prefs.prayers) {
        (prayerOrder.filter((k) => k !== "Sunrise") as PrayerKey[]).forEach((key) => {
          const at = toDate(t[key], now);
          const diffMin = (at.getTime() - now.getTime()) / 60000;
          if (diffMin <= prefs.beforeMinutes && diffMin > prefs.beforeMinutes - 1.1) {
            fireOnce(`pre-${key}`, () => {
              notify(
                `اقترب موعد صلاة ${prayerNames[key]}`,
                `بقي ${prefs.beforeMinutes} دقيقة على الأذان — استعد للصلاة.`,
                `pre-${key}`,
              );
              toast(`اقترب موعد صلاة ${prayerNames[key]}`, {
                description: `بقي ${prefs.beforeMinutes} دقيقة تقريبًا`,
              });
            });
          }
          if (diffMin <= 0 && diffMin > -1.1) {
            fireOnce(`adhan-${key}`, () => {
              notify(`حان الآن موعد صلاة ${prayerNames[key]}`, "حيّ على الصلاة، حيّ على الفلاح", key);
              toast.success(`حان الآن موعد صلاة ${prayerNames[key]}`);
              if (prefs.adhanSound) playAdhan();
            });
          }
        });
      }

      const hour = now.getHours();
      const minute = now.getMinutes();

      if (prefs.azkar && hour === 6 && minute < 1) {
        fireOnce("azkar-morning", () => {
          notify("أذكار الصباح", "لا تنسَ أذكار الصباح، حصنك ليومك بإذن الله.", "azkar-morning");
        });
      }
      if (prefs.azkar && hour === 17 && minute < 1) {
        fireOnce("azkar-evening", () => {
          notify("أذكار المساء", "حان وقت أذكار المساء، اجعل ختام يومك ذكرًا.", "azkar-evening");
        });
      }
      if (prefs.hadith && hour === 9 && minute < 1) {
        fireOnce("hadith-day", () => {
          void fetchHadiths().then((list) => {
            const h = hadithOfTheDay(list);
            notify("حديث اليوم", h ? h.text.slice(0, 180) : "افتح الموقع لقراءة حديث اليوم", "hadith-day");
          });
        });
      }
      if (prefs.hadith && hour === 20 && minute < 1) {
        fireOnce("tip-day", () => notify("نصيحة اليوم", tipOfTheDay(), "tip-day"));
      }
    };

    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return null;
}
