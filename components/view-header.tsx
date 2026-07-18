import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ViewHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Reusable header component for popup tab views.
 * Provides consistent title and subtitle styling across all views.
 */
export default function ViewHeader({ title, subtitle }: ViewHeaderProps) {
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mb: 0.5, fontSize: "1rem" }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ fontSize: "0.8rem" }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
