// Service Notifications - Rappel quotidien du rituel du soir
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID = 'rappel-soir';
const TRIGGER_NOTIFICATION_ID = 'rappel-soir-quotidien';
const STORAGE_KEY = 'rappelSoirHeure'; // heure (0-23) si activé, absent si désactivé

/**
 * Calcule le prochain déclenchement pour l'heure donnée (aujourd'hui si pas encore
 * passée, sinon demain).
 */
function prochainDeclenchement(heure: number): Date {
  const date = new Date();
  date.setHours(heure, 0, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

/**
 * Demande la permission de notification (obligatoire sur Android 13+) et crée
 * le canal de notification Android.
 */
export async function demanderPermissionNotification(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

/**
 * Active le rappel quotidien à l'heure donnée. Retourne false si la permission
 * a été refusée.
 */
export async function activerRappelSoir(
  heure: number,
  titre: string,
  message: string,
): Promise<boolean> {
  const autorise = await demanderPermissionNotification();
  if (!autorise) return false;

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Rappel du soir',
    importance: AndroidImportance.DEFAULT,
  });

  // Pas d'alarme exacte (alarmManager) : évite d'avoir à déclarer/justifier la
  // permission SCHEDULE_EXACT_ALARM auprès de Google Play. Un délai de
  // quelques minutes est largement acceptable pour un rappel du soir.
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: prochainDeclenchement(heure).getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: TRIGGER_NOTIFICATION_ID,
      title: titre,
      body: message,
      android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
    },
    trigger,
  );

  await AsyncStorage.setItem(STORAGE_KEY, String(heure));
  return true;
}

/**
 * Désactive le rappel quotidien.
 */
export async function desactiverRappelSoir(): Promise<void> {
  await notifee.cancelTriggerNotification(TRIGGER_NOTIFICATION_ID);
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Charge la préférence sauvegardée localement (heure choisie, ou null si désactivé).
 */
export async function chargerPreferenceRappel(): Promise<number | null> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value !== null ? parseInt(value, 10) : null;
}
