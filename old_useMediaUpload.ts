import { useState } from "react";
import { auth, storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";

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
      // Ensure Firebase Auth session exists so Storage rules (request.auth != null) pass.
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (authError) {
      console.warn("Anonymous sign-in failed:", authError);
      // Continue anyway ΓÇö upload will fail with a permission error if rules are strict.
    }
    try {
      // Use XMLHttpRequest as fetch() for local file:// URIs is known to randomly fail in React Native release builds on Android
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error("XHR blob conversion error:", e);
          reject(new TypeError("Local file conversion failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      // Build a unique filename
      const ext = type === "video" ? "mp4" : "jpg";
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
      const storageRef = ref(storage, `canvases/${projectId}/${filename}`);

      // Upload
      await uploadBytes(storageRef, blob);

      // Return public download URL
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (e: any) {
      console.error("Media upload failed:", e);
      // We are showing the exact error message so the user knows if it's a Permission/Rules error or a File/Blob error
      alert(`Upload Failed: ${e.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadMedia };
};
