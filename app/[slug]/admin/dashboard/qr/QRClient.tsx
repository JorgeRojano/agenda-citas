"use client";

import { useState, useEffect } from "react";
import { Button, Group, SegmentedControl, Stack, Text, TextInput } from "@mantine/core";
import { IconDownload, IconPrinter, IconQrcode } from "@tabler/icons-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

const SIZE_MAP = { pequeño: 160, mediano: 220, grande: 280 };
type SizeKey = keyof typeof SIZE_MAP;

const COLOR_HEX: Record<string, string> = {
  red: "#fa5252", pink: "#e64980", grape: "#be4bdb", violet: "#7950f2",
  indigo: "#4c6ef5", blue: "#228be6", cyan: "#15aabf", teal: "#12b886",
  green: "#40c057", lime: "#82c91e", yellow: "#fab005", orange: "#fd7e14",
  gray: "#868e96", dark: "#343a40",
};

const LOGO_SIZE = 72;
const BAND_HEIGHT = 88;

function Flyer({
  businessName, logoUrl, description, color, qrValue, qrSize,
}: {
  businessName: string;
  logoUrl: string | null;
  description: string | null;
  color: string;
  qrValue: string;
  qrSize: number;
}) {
  const cardWidth = qrSize + 80;

  return (
    <div
      id="qr-printable"
      style={{
        width: cardWidth,
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {/* Banda superior de color */}
      <div style={{ width: "100%", height: BAND_HEIGHT, background: color, flexShrink: 0, position: "relative" }}>
        {/* Círculos decorativos */}
        <div style={{
          position: "absolute", top: -24, right: -24,
          width: 96, height: 96, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }} />
        <div style={{
          position: "absolute", bottom: -16, left: 16,
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
        }} />
      </div>

      {/* Logo — sobresale de la banda */}
      <div style={{ marginTop: -(LOGO_SIZE / 2), zIndex: 1, flexShrink: 0 }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="logo"
            style={{
              width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 14,
              objectFit: "cover", display: "block",
              border: "3px solid white",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <div style={{
            width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 14,
            background: color,
            border: "3px solid white",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "white",
          }}>
            {businessName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nombre y descripción */}
      <div style={{ padding: "10px 24px 0", width: "100%", boxSizing: "border-box" }}>
        <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
          {businessName}
        </p>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: color, margin: "0 auto 8px" }} />
        {description && (
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#777", lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>

      {/* QR */}
      <div style={{ padding: "16px 24px 12px" }}>
        <QRCodeSVG
          value={qrValue || " "}
          size={qrSize}
          level="H"
          marginSize={1}
          fgColor="#111111"
        />
      </div>

      {/* CTA footer */}
      <div style={{
        width: "100%", padding: "12px 20px 18px",
        background: color + "14",
        borderTop: `2px solid ${color}25`,
        boxSizing: "border-box",
      }}>
        <p style={{
          margin: "0 0 4px", fontSize: 11, fontWeight: 700,
          color: color, textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Escanéame para agendar
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#aaa", wordBreak: "break-all" }}>
          {qrValue}
        </p>
      </div>
    </div>
  );
}

export default function QRClient({
  businessName, slug, logoUrl, description, primaryColor,
}: {
  businessName: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  primaryColor: string;
}) {
  const [size, setSize] = useState<SizeKey>("mediano");
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const businessUrl = origin ? `${origin}/${slug}` : "";
  const color = COLOR_HEX[primaryColor] ?? COLOR_HEX.blue;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#qr-canvas canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <style>{`
        @page { size: auto; margin: 0; }
        @media print {
          body * { visibility: hidden !important; }
          #qr-printable, #qr-printable * { visibility: visible !important; }
          #qr-printable {
            position: fixed !important;
            top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important;
            border-radius: 16px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <Stack gap="lg" maw={520}>
        <Group gap="xs">
          <IconQrcode size={22} />
          <Text fw={700} size="lg">Código QR</Text>
        </Group>
        <Text size="sm" c="dimmed">
          Imprime este código y colócalo en tu negocio. Tus clientes podrán escanearlo para
          visitar la página de tu negocio directamente desde su celular.
        </Text>

        <TextInput label="URL de tu negocio" value={businessUrl} readOnly size="sm" />

        <SegmentedControl
          value={size}
          onChange={(v) => setSize(v as SizeKey)}
          data={[
            { label: "Pequeño", value: "pequeño" },
            { label: "Mediano", value: "mediano" },
            { label: "Grande",  value: "grande"  },
          ]}
        />

        {/* Preview */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: 32,
          background: "var(--mantine-color-default-border)",
          borderRadius: 12,
          minHeight: 200,
        }}>
          <Flyer
            businessName={businessName}
            logoUrl={logoUrl}
            description={description}
            color={color}
            qrValue={businessUrl}
            qrSize={SIZE_MAP[size]}
          />
        </div>

        {/* Canvas oculto para descarga PNG */}
        <div id="qr-canvas" style={{ display: "none" }}>
          <QRCodeCanvas value={businessUrl || " "} size={600} marginSize={2} level="H" />
        </div>

        <Group>
          <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button variant="default" leftSection={<IconDownload size={16} />} onClick={handleDownload}>
            Descargar PNG
          </Button>
        </Group>
      </Stack>
    </>
  );
}
