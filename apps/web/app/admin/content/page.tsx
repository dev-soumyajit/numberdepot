'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';

const contentSections = [
  {
    title: 'FAQ',
    description: 'Manage frequently asked questions displayed on the FAQ page.',
    icon: <HelpOutlineIcon sx={{ fontSize: 40 }} />,
    color: '#4BA0A1',
    href: '/admin/content/faqs',
  },
  {
    title: 'Static Pages',
    description: 'Edit About Us, Terms of Service, and Privacy Policy pages.',
    icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
    color: '#002664',
    href: '/admin/content/pages',
  },
  {
    title: 'Blog Posts',
    description: 'Create and manage blog posts for the company blog.',
    icon: <ArticleIcon sx={{ fontSize: 40 }} />,
    color: '#E53935',
    href: '/admin/content/blog',
  },
];

export default function AdminContentPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#002664' }}>
          Content Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage FAQs, static pages, and blog content.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {contentSections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      bgcolor: section.color + '12',
                      color: section.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                    <Button variant="outlined" size="small" href={section.href}>
                      Manage
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
