import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseMeta, gameJsonUrl, cacheKeyForGame, DEFAULT_GAME, GAME_STORAGE_KEY } from '../data/meta';
import { strings, type Lang } from '../i18n/strings';
import { LANG_STORAGE_KEY } from '../i18n/LanguageContext';

const TASK = 'meta-check';
const HASH_KEY = 'meta.lastNotifiedHash';

// Pure so it's unit-testable without mocking AsyncStorage/fetch. lastNotified
// is null on the very first check (no baseline yet) — that must stay silent
// so a fresh install doesn't fire a bogus "meta updated" alert.
export function shouldNotify(lastNotified: string | null, currentHash: string, notifyEnabled: boolean): boolean {
  return notifyEnabled && lastNotified !== null && lastNotified !== currentHash;
}

TaskManager.defineTask(TASK, async () => {
  try {
    const gameId = (await AsyncStorage.getItem(GAME_STORAGE_KEY)) ?? DEFAULT_GAME;
    const res = await fetch(gameJsonUrl(gameId));
    if (!res.ok) return BackgroundTask.BackgroundTaskResult.Failed;

    const text = await res.text();
    const meta = parseMeta(text);
    const lastNotified = await AsyncStorage.getItem(HASH_KEY);

    // Ayarlar'daki "Meta updates" anahtari kapaliysa bildirim gonderilmez,
    // ama veri yine de tazelenir.
    const notifyEnabled = (await AsyncStorage.getItem('notifyOnMetaChange')) !== '0';

    if (shouldNotify(lastNotified, meta.sourceHash, notifyEnabled)) {
      const savedLang = await AsyncStorage.getItem(LANG_STORAGE_KEY);
      const lang: Lang = savedLang === 'tr' ? 'tr' : 'en';
      await Notifications.scheduleNotificationAsync({
        content: { title: strings[lang]['feed.metaUpdated'], body: strings[lang]['notify.metaBody'] },
        trigger: null,
      });
    }

    await AsyncStorage.setItem(HASH_KEY, meta.sourceHash);
    await AsyncStorage.setItem(cacheKeyForGame(gameId), text);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerMetaCheck() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const registered = await TaskManager.isTaskRegisteredAsync(TASK);
  if (registered) return;

  // ponytail: gunde bir yeterli, veri gunde en fazla bir kez degisiyor.
  await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 60 * 24 });
}
