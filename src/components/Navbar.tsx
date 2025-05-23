/* eslint-disable @typescript-eslint/no-unused-vars, max-len */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
  Container,
  Nav,
  Navbar,
} from 'react-bootstrap';
import { BoxArrowRight, Lightbulb, Shield } from 'react-bootstrap-icons';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const pathName = usePathname();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.isAdmin === true;

  // detect "/signup/stepN"
  const signupMatch = pathName.match(/^\/signup\/step(\d+)$/);
  const currentStep = signupMatch ? parseInt(signupMatch[1], 10) : null;
  const inSignupFlow = signupMatch !== null;
  // disable full nav for steps 1–4
  const disableFullNav = inSignupFlow && currentStep !== null && currentStep < 5;
  const showFullNav = isLoggedIn && !disableFullNav;

  // clickable on steps 1 & 2 (or anywhere outside steps 3/4)
  const brandIsClickable = !inSignupFlow
    || currentStep === 1
    || currentStep === 2
    || (currentStep !== null && currentStep >= 5);

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        {brandIsClickable ? (
          <Navbar.Brand as={Link} href={isLoggedIn ? '/dashboard' : '/'}>
            Manoa Compass
          </Navbar.Brand>
        ) : (
          <Navbar.Brand>
            Manoa Compass
          </Navbar.Brand>
        )}

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {showFullNav ? (
              <>
                {/* — full menu when logged in & not in steps 1–4 — */}
                <Nav.Link as={Link} href="/dashboard" active={pathName === '/dashboard'}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} href="/suggestions" active={pathName === '/dashboard'}>
                  Suggestions
                </Nav.Link>
                <Nav.Link as={Link} href="/clubs" active={pathName === '/clubs'}>
                  Clubs
                </Nav.Link>
                <Nav.Link as={Link} href="/events" active={pathName === '/events'}>
                  Events
                </Nav.Link>
                {isAdmin && (
                  <Nav.Link as={Link} href="/admin" active={pathName === '/admin'}>
                    <Shield className="me-1" />
                    Admin
                  </Nav.Link>
                )}
                <Nav.Link as={Link} href="/profile" active={pathName === '/profile'}>
                  Profile
                </Nav.Link>
                <Nav.Link as={Link} href="/api/auth/signout">
                  <Button variant="outline-danger" size="sm">
                    <BoxArrowRight className="me-1" />
                    Logout
                  </Button>
                </Nav.Link>
              </>
            ) : (
              <>
                {/* — minimal menu (brand + SU/SI) everywhere else — */}
                <Nav.Link
                  as={Link}
                  href="/signup/step1"
                  active={pathName?.startsWith('/signup')}
                >
                  Sign Up
                </Nav.Link>
                <Nav.Link as={Link} href="/api/auth/signin">
                  <Button variant="outline-primary" size="sm">
                    Sign In
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
