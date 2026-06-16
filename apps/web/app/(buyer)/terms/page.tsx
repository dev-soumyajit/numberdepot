import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function TermsPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '80vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #002664 0%, #001a45 100%)', py: 5, color: '#fff' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center' }}>
            Terms of Service
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>1. Acceptance of Terms</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              By accessing and using NumberDepot, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>2. Use of Service</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              NumberDepot provides a marketplace for buying, selling, parking, and forwarding phone numbers. Users must be at least 18 years old and provide accurate account information. You are responsible for maintaining the confidentiality of your account credentials.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>3. Purchases and Payments</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              All purchases are subject to availability. Prices are listed in USD and may change without notice. Subscription fees are billed monthly and are non-refundable except as required by law. Number transfers are final once completed.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>4. Seller Obligations</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              Sellers must have legitimate ownership or rights to any phone numbers listed on the platform. Misrepresentation of number ownership or capabilities is strictly prohibited and may result in account termination.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>5. Limitation of Liability</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              NumberDepot shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our service. Our total liability shall not exceed the amount paid by you in the preceding 12 months.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>6. Changes to Terms</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
