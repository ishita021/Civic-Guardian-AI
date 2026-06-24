import HeroSection     from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks      from '../components/landing/HowItWorks';
import CivicStats      from '../components/landing/CivicStats';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CivicStats />
    </>
  );
}
