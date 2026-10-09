import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
export default function Brand({name}: {name: string}) { return <Tooltip title={name}><Typography sx={{fontSize: '1.25rem', color: 'primary.main', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis'}}>◈ {name}</Typography></Tooltip>; }
