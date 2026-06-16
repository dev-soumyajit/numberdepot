import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

const posts = [
  {
    title: 'How to Choose the Right Vanity Number for Your Business',
    excerpt: 'A vanity number can make your business memorable. Learn how to pick the perfect one that aligns with your brand and is easy for customers to remember.',
    category: 'Tips',
    date: 'May 15, 2026',
  },
  {
    title: 'Toll-Free vs. Local Numbers: Which is Better?',
    excerpt: 'Understanding the differences between toll-free and local numbers can help you make the right choice for your communication needs.',
    category: 'Guide',
    date: 'May 8, 2026',
  },
  {
    title: 'Number Parking: What It Is and Why You Need It',
    excerpt: 'Number parking lets you reserve a phone number without activating full service. Here is why it is a smart strategy for businesses planning ahead.',
    category: 'Features',
    date: 'April 28, 2026',
  },
  {
    title: 'The Complete Guide to Porting Your Phone Number',
    excerpt: 'Moving your existing number to NumberDepot is easier than you think. Follow our step-by-step guide to port your number seamlessly.',
    category: 'Guide',
    date: 'April 20, 2026',
  },
  {
    title: 'Top 5 Area Codes for Business Presence',
    excerpt: 'Certain area codes carry prestige and recognition. Discover which area codes can give your business a competitive edge.',
    category: 'Tips',
    date: 'April 12, 2026',
  },
  {
    title: 'How Call Forwarding Can Transform Your Workflow',
    excerpt: 'Set up intelligent call forwarding to never miss an important call. Learn about scheduled forwarding, simultaneous ring, and more.',
    category: 'Features',
    date: 'April 5, 2026',
  },
];

const categoryColors: Record<string, string> = {
  Tips: '#E53935',
  Guide: '#4BA0A1',
  Features: '#84BD00',
};

export default function BlogPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '80vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #002664 0%, #001a45 100%)', py: 5, color: '#fff' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center' }}>
            Blog
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 1, opacity: 0.85 }}>
            Tips, guides, and news about phone numbers and telecommunications.
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid key={post.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={post.category}
                      size="small"
                      sx={{
                        bgcolor: (categoryColors[post.category] || '#002664') + '18',
                        color: categoryColors[post.category] || '#002664',
                        fontWeight: 700,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">{post.date}</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.4 }}>
                    {post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, lineHeight: 1.7, mb: 2 }}>
                    {post.excerpt}
                  </Typography>
                  <Button variant="outlined" size="small" fullWidth>
                    Read More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
