import { useState } from "react";
import { storage } from "../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);

  /**
   * Upload a media file to Firebase Storage and return its public download URL.
   * @param uri - local file URI from expo-image-picker
   * @param type - 'image' | 'video'
   * @param projectId - used to organise files under canvases/{projectId}/
   */
  const uploadMedia = async (
    uri: string,
    type: "image" | "video",
    projectId: string,
  ): Promise<string | null> => {
    setUploading(true);
    try {
      // In Expo 50+, fetch() handles local file:// URIs natively and correctly returns a Web Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Build a unique filename
      const ext = type === "video" ? "mp4" : "jpg";
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
      const storageRef = ref(storage, `canvases/${projectId}/${filename}`);

      // Upload
      await uploadBytes(storageRef, blob);

      // Return public download URL
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (e) {
      console.error("Media upload failed:", e);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadMedia };
};
