// components/ui/file-dropzone.tsx
"use client";

import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

type FileDropzoneProps = {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // bytes
};

export function FileDropzone({ onFilesChange, accept, maxFiles = 1, maxSize }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles,
    maxSize,
    onDrop: onFilesChange,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">
        {isDragActive ? "Drop files here..." : "Drag & drop or click to select"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {maxFiles > 1 ? "Multiple files allowed" : "Single file"}
      </p>
    </div>
  );
}