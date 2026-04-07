import { lazy, Suspense, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from './Hero';
import ProblemSolution from './ProblemSolution';
import MobileAppSection from './MobileAppSection';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

// Lazy load heavy components for better performance
const RoleFeatures = lazy(() => import('./RoleFeatures'));
const AIFeatures = lazy(() => import('./AIFeatures'));
const Benefits = lazy(() => import('./Benefits'));
const DemoForm = lazy(() => import('./DemoForm'));

// Loading fallback component
const SectionLoader = () => (
  <div className="py-16 md:py-24 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

export default function LandingPage() {
  const demoFormRef = useRef(null);

  const scrollToDemo = () => {
    demoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        {/* Primary Meta Tags */}
        <title>
          School Management Software | Multi-Tenant ERP for Schools in India
        </title>
        <meta
          name="description"
          content="Complete school management system with web and mobile apps for admins, teachers, parents, and students. Features include automated payroll, attendance tracking, AI tutor, quiz generator, fee management, and real-time performance analytics. Trusted by 500+ schools across India."
        />
        <meta
          name="keywords"
          content="school management software India, school ERP system, student management system, multi-tenant school software, school administration software, payroll management for schools, attendance tracking system, AI tutor for students, school mobile app, parent communication app, fee management software, academic performance tracking"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eukolia.shop/" />
        <meta
          property="og:title"
          content="School Management Software | Multi-Tenant ERP for Schools"
        />
        <meta
          property="og:description"
          content="Transform your school with our all-in-one management platform. Manage students, staff, payroll, and communication with AI-powered features."
        />
        <meta property="og:image" content="https://eukolia.shop/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://eukolia.shop/" />
        <meta
          property="twitter:title"
          content="School Management Software | Multi-Tenant ERP for Schools"
        />
        <meta
          property="twitter:description"
          content="Complete school ERP with mobile apps, AI tutor, automated payroll, and real-time tracking."
        />
        <meta
          property="twitter:image"
          content="https://eukolia.shop/og-image.jpg"
        />

        {/* Additional Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="SchoolERP" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://eukolia.shop/" />

        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SchoolERP - School Management Software',
            applicationCategory: 'EducationApplication',
            operatingSystem: 'Web, Android, iOS',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
              description: 'Free Demo Available',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '500',
            },
            description:
              'Complete school management system with AI-powered features for modern institutions in India',
          })}
        </script>
      </Helmet>

      {/* Page Content */}
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <Hero onDemoClick={scrollToDemo} />

        {/* Problem Solution Section */}
        <ProblemSolution />

        {/* Role-Based Features - Lazy Loaded */}
        <Suspense fallback={<SectionLoader />}>
          <RoleFeatures />
        </Suspense>

        {/* Mobile App Section */}
        <MobileAppSection />

        {/* AI Features Section - Lazy Loaded */}
        <Suspense fallback={<SectionLoader />}>
          <AIFeatures />
        </Suspense>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Benefits Section - Lazy Loaded */}
        <Suspense fallback={<SectionLoader />}>
          <Benefits />
        </Suspense>

        {/* Demo Form Section - Lazy Loaded */}
        <div ref={demoFormRef}>
          <Suspense fallback={<SectionLoader />}>
            <DemoForm />
          </Suspense>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
