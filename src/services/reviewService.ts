import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const TOTAL_SECONDS_KEY = 'review_total_seconds';
const NEXT_PROMPT_KEY = 'review_next_prompt_at';

const FIRST_PROMPT_AT = 4 * 60; // 4 minutes
const PROMPT_AFTER_LATER = 8 * 60; // 8 minutes
const PROMPT_AFTER_YES = 60 * 60; // 60 minutes

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.historyvoice';

export async function addStorySeconds(seconds: number): Promise<void> {
  const total = await getTotalSeconds();
  await AsyncStorage.setItem(TOTAL_SECONDS_KEY, String(total + seconds));
}

async function getTotalSeconds(): Promise<number> {
  const val = await AsyncStorage.getItem(TOTAL_SECONDS_KEY);
  return val ? parseInt(val, 10) : 0;
}

async function getNextPromptAt(): Promise<number> {
  const val = await AsyncStorage.getItem(NEXT_PROMPT_KEY);
  return val ? parseInt(val, 10) : FIRST_PROMPT_AT;
}

export async function checkAndPromptReview(): Promise<{ shouldShow: boolean; currentTotal: number }> {
  const total = await getTotalSeconds();
  const nextPromptAt = await getNextPromptAt();
  return { shouldShow: total >= nextPromptAt, currentTotal: total };
}

export async function onReviewResponse(response: 'yes' | 'later', currentTotal: number): Promise<void> {
  if (response === 'yes') {
    await AsyncStorage.setItem(NEXT_PROMPT_KEY, String(currentTotal + PROMPT_AFTER_YES));
    Linking.openURL(PLAY_STORE_URL);
  } else {
    await AsyncStorage.setItem(NEXT_PROMPT_KEY, String(currentTotal + PROMPT_AFTER_LATER));
  }
}