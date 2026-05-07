"use client";

import { Paper, Stack, Text, SimpleGrid, ActionIcon, Center, Loader } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { showNotification } from "@mantine/notifications";

interface BusinessImage {
  id: string;
  url: string;
  order: number;
}

interface Props {
  slug: string;
  initialImages: BusinessImage[];
}

export function GallerySection({ slug, initialImages }: Props) {
  const [images, setImages]     = useState<BusinessImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > 10) {
      showNotification({ title: "Límite alcanzado", message: "Máximo 10 imágenes", color: "yellow" });
      return;
    }

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification({ title: "Archivo muy grande", message: `${file.name} supera 5 MB`, color: "red" });
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/business/${slug}/images`, {
          method: "POST", body: formData,
        });
        if (!res.ok) throw new Error();
        const newImage = await res.json();
        setImages((prev) => [...prev, newImage]);
      } catch {
        showNotification({ title: "Error", message: `No se pudo subir ${file.name}`, color: "red" });
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/business/${slug}/images?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      showNotification({ title: "Error", message: "No se pudo eliminar la imagen", color: "red" });
    }
    setDeletingId(null);
  };

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Text fw={600}>Galería</Text>

        {images.length > 0 && (
          <SimpleGrid cols={3} spacing={8}>
            {images.map((img, i) => (
              <div
                key={img.id}
                style={{
                  position: "relative", aspectRatio: "1",
                  borderRadius: 8, overflow: "hidden",
                  border: "0.5px solid var(--mantine-color-default-border)",
                }}
              >
                <img
                  src={img.url} alt={`Imagen ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Número de orden */}
                <div style={{
                  position: "absolute", bottom: 4, left: 4,
                  fontSize: 9, fontWeight: 500, padding: "1px 5px",
                  background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 4,
                }}>
                  {i + 1}
                </div>
                {/* Botón eliminar */}
                <ActionIcon
                  size={20} radius="xl" variant="filled" color="dark"
                  loading={deletingId === img.id}
                  onClick={() => handleDelete(img.id)}
                  style={{ position: "absolute", top: 4, right: 4, opacity: 0.85 }}
                >
                  <IconX size={10} />
                </ActionIcon>
              </div>
            ))}
          </SimpleGrid>
        )}

        {/* Upload zone */}
        <input
          ref={inputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files)}
        />
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: "1.5px dashed var(--mantine-color-default-border)",
            borderRadius: 10, padding: "20px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            cursor: uploading ? "not-allowed" : "pointer",
            background: "var(--mantine-color-default-hover)",
            opacity: uploading ? 0.7 : 1,
            transition: "border-color 0.15s",
          }}
        >
          {uploading ? (
            <>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Subiendo imagen...</Text>
            </>
          ) : (
            <>
              <IconUpload size={22} color="var(--mantine-color-dimmed)" />
              <Text size="sm" fw={500} c="dimmed">Subir imágenes</Text>
              <Text size="xs" c="dimmed">JPG, PNG o WEBP · máx. 5 MB por imagen</Text>
            </>
          )}
        </div>

        <Text size="xs" c="dimmed">
          Máximo 10 imágenes · {images.length}/10 usadas
        </Text>
      </Stack>
    </Paper>
  );
}