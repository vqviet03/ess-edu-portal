import { AppIcon } from "@/features/pwa/app-icon";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
export default function Brand({ name }: { name: string }) {
  return (
    <Tooltip title={name}>
      <Typography
        sx={{
          fontSize: "1.25rem",
          color: "primary.main",
          fontWeight: 700,
          whiteSpace: "nowrap",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <AppIcon />
        {/* Phones show only the icon; the name stays available to readers. */}
        <Box
          component="span"
          sx={{
            display: { xs: "none", sm: "inline" },
          }}
        >
          {name}
        </Box>
        <Box
          component="span"
          sx={{
            display: { xs: "inline", sm: "none" },
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Box>
      </Typography>
    </Tooltip>
  );
}
