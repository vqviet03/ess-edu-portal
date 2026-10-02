import { Box, Stack, Typography } from "@mui/material";
import Icon from "./icon";
export default function Brand() {
    return <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
    <Box sx={{ bgcolor: "primary.main", color: "white", width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center" }}><Icon name="book"/></Box>
    <Typography sx={{ fontWeight: 750, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>Lớp học<span style={{ color: "#1769d2" }}>.</span></Typography>
  </Stack>;
}
