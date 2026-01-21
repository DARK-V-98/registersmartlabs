import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import CoursesPreview from "@/components/home/CoursesPreview";
import StatsSection from "@/components/home/StatsSection";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CoursesPreview />
      <StatsSection />
      <HowItWorks />
      <CTASection />
    </Layout>
  );
};

export default Index;
