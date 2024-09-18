export const hostingUrl =
  process.env.NODE_ENV === "development"
    ? `http://${window.location.hostname}:3000`
    : `https://${window.location.host}`;

export const tileTexturesList = [
  { type: "red", url: `${hostingUrl}/assets/tile-red.svg` },
  { type: "green", url: `${hostingUrl}/assets/tile-green.svg` },
  { type: "blue", url: `${hostingUrl}/assets/tile-blue.svg` },
  { type: "pink", url: `${hostingUrl}/assets/tile-pink.svg` },
  { type: "orange", url: `${hostingUrl}/assets/tile-orange.svg` },
  { type: "yellow", url: `${hostingUrl}/assets/tile-yellow.svg` },
];

export const otherTexturesList = [
  { type: "win-bg", url: `${hostingUrl}/assets/win-bg.svg` },
  { type: "win-text", url: `${hostingUrl}/assets/win-text.svg` },
  { type: "fail-bg", url: `${hostingUrl}/assets/fail-bg.svg` },
  { type: "fail-text", url: `${hostingUrl}/assets/fail-text.svg` },
];

export type TextureTypes = {
  type: string;
  url: string;
}[];
