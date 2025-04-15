import { Container, Row, Col } from 'react-bootstrap';
import styles from './Footer.module.css';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className={styles.footer}>
    <Container>
      <Row className="py-4">
        <Col md={4} className="mb-4 mb-md-0">
          <h5 className={styles.footerHeading}>Manoa Compass</h5>
          <p className={styles.footerText}>
            Connecting UH Manoa students with clubs, events, and resources on campus.
          </p>
        </Col>
        <Col md={2} className="mb-4 mb-md-0">
          <h6 className={styles.footerHeading}>Explore</h6>
          <ul className={styles.footerLinks}>
            <li><a href="/clubs">Clubs</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/map">Campus Map</a></li>
          </ul>
        </Col>
        <Col md={2} className="mb-4 mb-md-0">
          <h6 className={styles.footerHeading}>Resources</h6>
          <ul className={styles.footerLinks}>
            <li><a href="#">Student Help</a></li>
            <li><a href="#">Club Registration</a></li>
            <li><a href="#">Event Planning</a></li>
          </ul>
        </Col>
        <Col md={4}>
          <h6 className={styles.footerHeading}>Contact</h6>
          <p className={styles.footerText}>University of Hawaii at Manoa<br />
          2500 Campus Road<br />
          Honolulu, HI 96822</p>
          <p className={styles.footerText}>
            <a href="mailto:info@manocompass.hawaii.edu">info@manocompass.hawaii.edu</a>
          </p>
        </Col>
      </Row>
      <Row className="pt-3 border-top">
        <Col className="text-center">
          <p className={styles.copyright}>© 2025 Manoa Compass. All rights reserved.</p>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
