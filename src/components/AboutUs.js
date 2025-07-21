import React from 'react';
import { Container, Row, Col, Image, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/AboutUs.css';

// Import feature icons
import recordsIcon from '../images/records.png';
import scanIcon from '../images/scan.png';
import consultationIcon from '../images/consultation.png';
import ucheckIcon from '../images/ucheck.png';

// Import service icons
import devicesIcon from '../images/devices.png';
import gpIcon from '../images/gp.png';
import folderIcon from '../images/folder.png';
import userIcon from '../images/user.png';
import techIcon from '../images/tech.png';

const AboutUs = () => {
  const features1 = [
    {
      icon: recordsIcon,
      title: 'Patient Record Management',
      text: 'Securely store and manage patient data.',
      link: '#records',
    },
    {
      icon: scanIcon,
      title: 'QR Code-Based Access',
      text: 'Easily retrieve medical records using QR codes.',
      link: '#qr-access',
    },
    {
      icon: consultationIcon,
      title: 'Consultation & Diagnostic Tracking',
      text: 'Document consultations and patient vitals.',
      link: '#consultation',
    },
    {
      icon: ucheckIcon,
      title: 'Secure Data Storage',
      text: 'Ensure confidential medical data is safely stored and accessible.',
      link: '#secure-data',
    },
  ];

  const features2 = [
    {
      icon: devicesIcon,
      title: 'Electronic Health Record (EHR)',
      text: 'A secure, cloud-based system designed to store and manage patient medical records, improving access and accuracy in healthcare.',
    },
    {
      icon: gpIcon,
      title: 'Revenue Cycle Management',
      text: 'Optimize financial processes, streamline billing, and manage collections for improved financial performance.',
    },
    {
      icon: folderIcon,
      title: 'Claims Processing & Insurance Services',
      text: 'Simplify medical claims management with accurate processing.',
    },
    {
      icon: userIcon,
      title: 'Maybunga Patient Portal',
      text: 'A user-friendly digital hub for patients to schedule appointments, access medical records, and communicate.',
    },
    {
      icon: techIcon,
      title: 'Maybunga Practice Management',
      text: 'Enhance clinic operations, manage staff scheduling, and maximize efficiency for better patient care.',
    },
  ];

  const numbers = [
    { value: '5000+', text: 'Patients served annually, ensuring accessible and quality healthcare for the community.' },
    { value: '30+', text: 'Dedicated medical professionals providing expert care.' },
    { value: '500+', text: 'Successful treatments and procedures performed monthly.' },
    { value: '8%', text: 'Increase in patient satisfaction with digital health solutions.' },
    { value: '25%', text: 'Reduction in administrative processing time due to automation.' },
    { value: '₱100M+', text: 'Total funding secured to improve healthcare services and technology integration.' },
  ];

  return (
    <>
      {/* Section 1: Hero Section */}
      <Container fluid className="about-us-hero-section text-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h1>About Us</h1>
              <p className="lead">
                Improving healthcare through innovation is at the heart of Maybunga Health Center's work. We provide electronic health records (EHR), practice management, and revenue cycle management solutions that help practices in multiple specialties grow profitably, remain compliant, work more efficiently, and improve patient outcomes.
              </p>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Section 2: Healthcare Solutions */}
      <Container className="py-5 text-center">
        <h2>User-friendly, integrated healthcare technology solutions</h2>
        <p className="subtitle-text">
          Keep your patients healthy, your providers happy, and your practice successful with simplified solutions for EHR, practice management, billing, and beyond.
        </p>
        <Row>
          {features1.map((feature, index) => (
            <Col md={3} key={index} className="mb-4 feature-col">
              <Image src={feature.icon} alt={feature.title} className="feature-icon mb-3" />
              <h5>{feature.title}</h5>
              <p className="feature-text">{feature.text}</p>
              <a href={feature.link} className="learn-more-link">Learn more &gt;</a>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Section 3: Services */}
      <Container fluid className="about-us-services-section py-5">
        <Container>
          <Row className="justify-content-center">
            {features2.slice(0, 3).map((feature, index) => (
              <Col md={4} key={index} className="mb-4 feature-col text-center">
                <Image src={feature.icon} alt={feature.title} className="feature-icon-services mb-3" />
                <h6>{feature.title}</h6>
                <p className="feature-text-services">{feature.text}</p>
              </Col>
            ))}
          </Row>
          <Row className="justify-content-center mt-4">
            {features2.slice(3).map((feature, index) => (
              <Col md={4} key={index + 3} className="mb-4 feature-col text-center">
                <Image src={feature.icon} alt={feature.title} className="feature-icon-services mb-3" />
                <h6>{feature.title}</h6>
                <p className="feature-text-services">{feature.text}</p>
              </Col>
            ))}
          </Row>
        </Container>
      </Container>

      {/* Section 4: Our History */}
      <Container className="py-5 text-center">
        <h2>Our history</h2>
        <Row className="justify-content-center">
          <Col md={8}>
            <p className="history-text">
              Maybunga Health Center was established to serve the growing healthcare needs of the community. Over the years, it has evolved from a small local clinic into a modern healthcare facility, providing accessible and quality medical services. With a commitment to innovation, the center has integrated digital healthcare solutions to enhance patient care, streamline operations, and improve medical record management.
            </p>
          </Col>
        </Row>
      </Container>

      {/* Section 5: Numbers */}
      <Container fluid className="about-us-numbers-section py-5">
        <Container>
          <h2 className="text-center mb-5">Maybunga by the numbers</h2>
          <Row>
            {numbers.map((num, index) => (
              <Col md={4} key={index} className="mb-4 number-col text-center">
                <h3>{num.value}</h3>
                <p>{num.text}</p>
              </Col>
            ))}
          </Row>
        </Container>
      </Container>

      {/* Section 6: Contact CTA */}
      <Container className="py-5 text-center">
        <h2>Have Questions?</h2>
        <p className="subtitle-text">
          We're here to help. Reach out to us for more information about our services and how we can assist you.
        </p>
        <Button 
          variant="primary" 
          as={Link} 
          to="/contact" 
          size="lg" 
          className="mt-3"
          style={{ backgroundColor: '#344767', borderColor: '#344767' }}
        >
          Contact Us
        </Button>
      </Container>
    </>
  );
};

export default AboutUs;