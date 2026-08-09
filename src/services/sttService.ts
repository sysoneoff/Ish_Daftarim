import { initWhisper, WhisperContext } from 'whisper.rn';
import RNFS from 'react-native-fs';

/**
 * Butunlay on-device ovozdan matnga o'tkazish xizmati.
 * Hech qanday tarmoq so'rovi yuborilmaydi — model qurilma xotirasida ishlaydi.
 *
 * ESLATMA (o'rnatish uchun): "small" ggml modelini (~480MB, ko'p tillik,
 * o'zbek tilini qamrab oladi) android/app/src/main/assets/models/ papkasiga
 * qo'shing. Model faylini quyidagi manbadan yuklab olish mumkin:
 * https://huggingface.co/ggerganov/whisper.cpp (ggml-small.bin)
 *
 * Ilova hajmini kichraytirish uchun modelni birinchi ishga tushirishda
 * qurilma xotirasiga (tashqi tarmoqsiz, faqat APK ichidan) nusxalash
 * mumkin — quyida shu yondashuv qo'llangan.
 */

const MODEL_ASSET_NAME = 'ggml-small.bin';
let whisperContext: WhisperContext | null = null;

async function ensureModelCopied(): Promise<string> {
  const destPath = `${RNFS.DocumentDirectoryPath}/${MODEL_ASSET_NAME}`;
  const exists = await RNFS.exists(destPath);
  if (!exists) {
    // Android assets papkasidan (APK ichidan) lokal faylga nusxalash — internet shart emas
    await RNFS.copyFileAssets(`models/${MODEL_ASSET_NAME}`, destPath);
  }
  return destPath;
}

export async function getWhisperContext(): Promise<WhisperContext> {
  if (whisperContext) return whisperContext;
  const modelPath = await ensureModelCopied();
  whisperContext = await initWhisper({ filePath: modelPath });
  return whisperContext;
}

export async function transcribeAudioFile(audioFilePath: string): Promise<string> {
  const ctx = await getWhisperContext();
  const { promise } = ctx.transcribe(audioFilePath, {
    language: 'uz', // Til qat'iy belgilanadi — avtomatik aniqlashga tayanilmaydi
    translate: false,
  });
  const result = await promise;
  return result.result?.trim() ?? '';
}

/**
 * Uzoq audio (majlis rejimi) uchun: faylni ~30 soniyalik bo'laklarga bo'lib
 * ketma-ket transkripsiya qilish. Bo'lish logikasi audio yozib olish
 * bosqichida (recorderService) amalga oshiriladi — bu funksiya bo'laklar
 * ro'yxatini qabul qilib, ularni birlashtirilgan matnga aylantiradi.
 */
export async function transcribeChunks(chunkFilePaths: string[]): Promise<string> {
  const results: string[] = [];
  for (const chunkPath of chunkFilePaths) {
    const text = await transcribeAudioFile(chunkPath);
    if (text) results.push(text);
  }
  return results.join(' ');
}

export async function releaseWhisper(): Promise<void> {
  if (whisperContext) {
    await whisperContext.release();
    whisperContext = null;
  }
}
