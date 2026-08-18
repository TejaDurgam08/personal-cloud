import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export default function Breadcrumbs({ items, onNavigate }) {
  return (
    <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const label =
          index === 0 ? (
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              color={isLast ? 'text.primary' : 'inherit'}
            >
              <HomeOutlinedIcon fontSize="small" /> {item.folder_name}
            </Typography>
          ) : (
            item.folder_name
          )

        if (isLast) {
          return (
            <Typography key={item.id ?? 'home'} variant="body2" color="text.primary" fontWeight={600}>
              {label}
            </Typography>
          )
        }

        return (
          <Link
            key={item.id ?? 'home'}
            component="button"
            variant="body2"
            underline="hover"
            color="text.secondary"
            onClick={() => onNavigate(item.id)}
          >
            {label}
          </Link>
        )
      })}
    </MuiBreadcrumbs>
  )
}
