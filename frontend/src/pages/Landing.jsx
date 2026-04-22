import React from 'react'
import Navbar from '../Components/Navbar'
import HeroSection from '../Components/HeroSection.jsx'
import Feature from '../Components/Feature.jsx'
import Work from '../Components/Work.jsx'
import CTASection from '../Components/CTASection.jsx'
import Footer from '../Components/Footer.jsx'
function Landing() {
    return (
        <>
            <Navbar />
            <HeroSection />
            <Feature />
            <Work />
            <CTASection />
            <Footer />
        </>
    )
}

export default Landing
