import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { TagCode } from '../game/types';

// A photo of where each tag is hidden, for the "Show me the hiding spot" hint.
// Photos stay on the phone that took them (they are not part of a shared course).
export type Photos = Partial<Record<TagCode, string>>;

const key = (spotsId: string) => `photos:${spotsId}`;

export async function loadPhotos(spotsId: string): Promise<Photos> {
  try {
    const raw = await AsyncStorage.getItem(key(spotsId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function savePhoto(spotsId: string, tag: TagCode, pickedUri: string): Promise<Photos> {
  // The camera's copy can be cleaned up by the phone, so keep our own.
  const dest = new File(Paths.document, `hiding-${spotsId}-${tag}-${Date.now()}.jpg`);
  new File(pickedUri).copySync(dest);
  const photos = await loadPhotos(spotsId);
  const old = photos[tag];
  photos[tag] = dest.uri;
  await AsyncStorage.setItem(key(spotsId), JSON.stringify(photos));
  if (old) {
    try {
      new File(old).delete();
    } catch {
      // already gone
    }
  }
  return photos;
}

// Opens the camera (or the photo gallery) and saves the picture for this tag.
// Returns the updated photos, or null if nothing was picked.
export async function pickHidingPhoto(spotsId: string, tag: TagCode, from: 'camera' | 'gallery'): Promise<Photos | null> {
  if (from === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('Camera permission is needed to take the hiding-spot photo.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5 };
  const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  return savePhoto(spotsId, tag, result.assets[0].uri);
}
