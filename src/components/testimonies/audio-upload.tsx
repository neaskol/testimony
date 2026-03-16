"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadAudio } from "@/actions/storage";

interface AudioUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}

export function AudioUpload({ currentUrl, onUpload }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAudio(formData);

    if (result.error) {
      setError(result.error);
      setUploading(false);
      return;
    }

    onUpload(result.data!.url);
    setUploading(false);

    // Reset input
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {currentUrl && (
        <audio controls className="w-full" src={currentUrl}>
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
          id="audio-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Envoi..." : currentUrl ? "Remplacer l'audio" : "Ajouter un audio"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
