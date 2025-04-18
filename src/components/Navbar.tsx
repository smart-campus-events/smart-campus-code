/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

// import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Container,
   Nav,
   Navbar,
   // NavDropdown,
   Button } from 'react-bootstrap';
import { BoxArrowRight,
  // Lock,
  // PersonFill,
  // PersonPlusFill
  } from 'react-bootstrap-icons';
import Link from 'next/link';

const NavBar: React.FC = () => {
  // const { data: session } = useSession();
  // const currentUser = session?.user?.email;
  // const userWithRole = session?.user as { email: string; randomKey: string };
  // const role = userWithRole?.randomKey;
  const pathName = usePathname();
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="/">Manoa Compass</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* TEMPORARY WORKAROUND: Always show logged-in links for frontend dev */}
            {[
                <Nav.Link as={Link} href="/dashboard" key="dashboard" active={pathName === '/dashboard'}>
                  Dashboard
                </Nav.Link>,
                <Nav.Link as={Link} href="/clubs" key="clubs" active={pathName === '/clubs'}>
                  Clubs
                </Nav.Link>,
                <Nav.Link as={Link} href="/events" key="events" active={pathName === '/events'}>
                  Events
                </Nav.Link>,
                <Nav.Link as={Link} href="/profile" key="profile" active={pathName === '/profile'}>
                  Profile
                </Nav.Link>,
                // TEMPORARY: Added Sign Up link for easy dev access
                <Nav.Link as={Link} href="/signup/step1" key="signup" active={pathName?.startsWith('/signup')}>
                  Sign Up (Dev)
                </Nav.Link>,
                <Nav.Link as={Link} href="/api/auth/signout" key="signout">
                  {/* Log out might not fully work without backend, but link is present */}
                  <Button variant="outline-danger" size="sm">
                    <BoxArrowRight className="me-1" />
                    Logout
                  </Button>
                </Nav.Link>,
              ]}
            {/* Original conditional logic commented out/removed for temporary workaround
            {currentUser
              ? [...]
              : [...]
            } */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
