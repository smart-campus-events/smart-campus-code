/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container, Nav, Navbar, Image } from 'react-bootstrap';
import { Bell, PersonCircle } from 'react-bootstrap-icons';
import styles from './Navbar.module.css';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const pathName = usePathname();
  
  return (
    <Navbar bg="white" expand="lg" className="py-2 shadow-sm">
      <Container>
        <Link href="/" passHref legacyBehavior>
          <Navbar.Brand className="d-flex align-items-center">
            <Image 
              src="/images/logo.svg" 
              alt="Manoa Compass" 
              width={40} 
              height={40} 
              className="d-inline-block align-top me-2" 
            />
          </Navbar.Brand>
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Link href="/clubs" passHref legacyBehavior>
              <Nav.Link active={pathName === '/clubs'}>Clubs</Nav.Link>
            </Link>
            <Link href="/events" passHref legacyBehavior>
              <Nav.Link active={pathName === '/events'}>Events</Nav.Link>
            </Link>
            <Link href="/map" passHref legacyBehavior>
              <Nav.Link active={pathName === '/map'}>Map</Nav.Link>
            </Link>
          </Nav>
          <Nav className="ms-auto">
            <Nav.Link href="/notifications" className="me-3 position-relative">
              <Bell size={20} />
              <span className={styles.notificationBadge}></span>
            </Nav.Link>
            <Link href="/profile" passHref legacyBehavior>
              <Nav.Link className={styles.profileLink}>
                <div className={styles.profileAvatar}>
                  <span>S</span>
                </div>
              </Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
