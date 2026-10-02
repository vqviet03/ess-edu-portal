import { SvgIcon, type SvgIconProps } from "@mui/material";

const paths = {
  book: "M21 4H7c-2.21 0-4 1.79-4 4v12c0 1.1.9 2 2 2h16v-2H5V8c0-1.1.9-2 2-2h14V4zM7 8h14v10H7V8zm2 2v2h10v-2H9zm0 4v2h7v-2H9z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  play: "M8 5v14l11-7z",
  close: "M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.3 19.71 2.89 18.29 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-13h-2v6l5 3 1-1.64-4-2.36V7z",
};
export default function Icon({ name, ...props }: SvgIconProps & { name: keyof typeof paths }) {
  return <SvgIcon {...props}><path d={paths[name]} /></SvgIcon>;
}
